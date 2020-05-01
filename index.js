const through = require('through2');
const pluginError = require('plugin-error');
const chalk = require('chalk');

const sharp = require('sharp');
const match = require('micromatch');
const glob = require('fast-glob');
const fs = require('fs');
const path = require('path');
const unixify = require('normalize-path');

const PLUGIN_NAME = require('./package.json').name;


const rename = (file, options) => {
  file.basename = (options.prefix || '') + file.stem + (options.suffix || '') + (options.extname || file.extname);
}

module.exports = (config, options = {}) => {

  return through.obj(function(file, encoding, callback) {

    if (file.isNull()) return callback(null, file);

    if (file.isStream()) return callback(new pluginError(PLUGIN_NAME, 'Streams are not supported'));

    if (file.isBuffer()) {

      for (const [pattern, commands] of Object.entries(config)) {
        if (match.isMatch(file.relative, pattern)) {

          console.log(file.relative);

          if (Array.isArray(commands)) {
            commandSet = commands;
            commandSet.forEach(commands => {
              let cloned = file.clone();
              let image = sharp(cloned.contents);
              Object.entries(commands).forEach(([api, params]) => {
                if (image[api]) image[api](params)
                else if (api == 'rename') {
                  rename(cloned, params);
                };
              });
              cloned.contents = image;
              this.push(cloned);
            })
          } else {
            let image = sharp(file.contents);
            Object.entries(commands).forEach(([api, params]) => {
              if (image[api]) image[api](params)
              else if (api == 'rename') {
                rename(file, params);
              };
            })
            file.contents = image;
            this.push(file);
          }
          break;
        }
      }

      callback();
    }
  })
};





const buildConfig = (patterns, root = process.cwd()) => {

  // Find all images...
  let images = [];
  glob.sync(patterns, {cwd:root}).forEach(file => {
    [...fs.readFileSync(`${root}/${file}`, {encoding: 'utf8'})
      .matchAll(/(?:https?:)?([/|.|\w|-]+[/|.|\w|\s|-|@]*\.(?:jpg|jpeg|png|tiff))/gi)]
      .forEach(match => {
        if (!path.isAbsolute(match[1])) match[1] = path.normalize(`/${path.dirname(file)}/${match[1]}`);
        images.push(unixify(match[1]));
      });
  });

  // ... and build the config elements (object/array) with needed information.
  let config = {};

  const addConfig = (name, details) => {
    if (typeof config[name] == 'undefined') {   // First time, that config item does not exist.
      config[name] = details;
      return;
    }

    if (!Array.isArray(config[name])) {         // Already one, so change to array.
      config[name] = [config[name]];
    }

    config[name].push(details);                 // Second and more, push to array
  };

  images.forEach(image => {
    let info, name, dpi, width, height;
    if ((info = /(.*)(?:-(\d{0,4})x(\d{0,4})(?:@(\d(?:\.\d)?)x)?)\.(jpg|jpeg|png|tiff)/.exec(image)) !== null) {
      name = info[1] + '.' + info[5];
      dpi = info[4] || 1;
      width = info[2] ? info[2] * dpi : undefined;
      height = info[3] ? info[3] * dpi : undefined;
      addConfig(name, {
        resize: {width: width, height: height},
        rename: image
      });
    } else {
      addConfig(image, {});
    }
  });

  return config;
};

module.exports.buildConfig = buildConfig;
