const
  through = require('through2'),
  pluginError = require('plugin-error'),
  fs = require('fs'),
  path = require('path');

const
  glob = require('fast-glob'),
  match = require('micromatch'),
  sharp = require('sharp'),
  unixify = require('normalize-path');

const PLUGIN_NAME = require('./package.json').name;


const alreadyExists = (file, destinationFolder, options) => {
  let destFilename =  (options.prefix || '') + (options.basename || file.stem) + (options.suffix || '') + (options.extname || file.extname);

  return fs.existsSync(path.join(destinationFolder, path.dirname(file.relative), destFilename));
};

const renameCommand = (file, options) => {
  if (typeof options == 'string') file.path = options;
  else file.basename =
    (options.prefix || '')
    + (options.basename || file.stem)
    + (options.suffix || '')
    + (options.extname || file.extname);
};

const allCommands = (file, image, commands) => {
  Object.entries(commands).forEach(([api, params]) => {
    if (image[api]) {
      if (api == 'resize') image[api](params || {fit:sharp.fit.cover, position:sharp.strategy.entropy});
      else image[api](params);
      image[api](params);
    } else if (api == 'rename') {
      renameCommand(file, params);
    }
  });
  return image;
};


module.exports = (config, destinationFolder) => {

  return through.obj(function(file, encoding, callback) {

    if (file.isNull()) return callback(null, file);

    if (file.isStream()) return callback(new pluginError(PLUGIN_NAME, 'Streams are not supported'));

    if (file.isBuffer()) {

      for (const [pattern, commandSet] of Object.entries(config)) {
        if (match.isMatch(file.relative, pattern)) {

          if (Array.isArray(commandSet)) {

            commandSet.forEach(commands => {
              if (destinationFolder && commands.rename && alreadyExists(file, destinationFolder, commands.rename)) {
                // File already exists
              } else {
                let cloned = file.clone();
                cloned.contents = allCommands(cloned, sharp(cloned.contents), commands);
                this.push(cloned);
              }
            });

          } else {

            let commands = commandSet;
            if (destinationFolder && commands.rename && alreadyExists(file, destinationFolder, commands.rename)) {
              // File already exists
            } else {
              file.contents = allCommands(file, sharp(file.contents), commands);
              this.push(file);
            }
          }
          break;
        }
      }

      callback();
    }
  });
};



module.exports.buildConfig = (patterns, root = process.cwd()) => {

  // Find all images...
  let images = [];
  glob.sync(patterns, {cwd:root}).forEach(file => {
    [...fs.readFileSync(`${root}/${file}`, {encoding: 'utf8'})
      // .matchAll(/(?:https?:)?([/|.|\w|-]+[/|.|\w|\s|-|@]*\.(?:jpg|jpeg|png|tiff|webp))/gi)]
      .matchAll(/(?:https?:)?([/.\w-]+[/.\w\s-%@]*\.(?:jpg|jpeg|png|tiff|webp))/gi)]
      .forEach(match => {
        match[1] = decodeURI(match[1]);
        if (path.isAbsolute(match[1])) match[1] = match[1].slice(1);
        else match[1] = path.normalize(`${path.dirname(file)}/${match[1]}`);
        images.push(unixify(match[1]));
      });
  });
  // Get only unique/distinct images
  images = [...new Set(images)];

  // ... and build the config elements (object/array) with needed information.
  let config = {};

  images.forEach(image => {
    let info, name, dpi, width, height;
    if ((info = /(.*)((?:-(\d{0,4})x(\d{0,4})(?:@(\d(?:\.\d)?)x)?))\.(jpg|jpeg|png|tiff|webp)/.exec(image)) !== null) {
      let details = {};
      dpi = info[5] || 1;
      width = info[3] ? info[3] * dpi : undefined;
      height = info[4] ? info[4] * dpi : undefined;
      details.resize = {width: width, height: height};
      switch(info[6]) {
        case 'webp':
          name = info[1] + '.jpg';
          details.rename = {suffix: info[2], extname: '.webp'};
          details.webp = {};
          break;
        default:
          name = info[1] + '.' + info[6];
          details.rename = {suffix: info[2]};
      }
      if (!config[name]) config[name] = [details];
      else config[name].push(details);
    } else {
      if (!config[name]) config[name] = [];
      else config[name].push({});
    }
  });

  return config;
};

const merge = (...args) => {
  let target = {};
  let merger = (obj) => {
    for (let prop in obj) {
      if (obj.hasOwnProperty(prop)) { // eslint-disable-line no-prototype-builtins
        if (Object.prototype.toString.call(obj[prop]) === '[object Object]') {
          target[prop] = merge(target[prop], obj[prop]);
        } else {
          target[prop] = obj[prop];
        }
      }
    }
  };
  for (let i = 0; i < args.length; i++) {
    merger(args[i]);
  }

  return target;
};

module.exports.insertSome = (config, select, newCommands) => {
  Object.entries(config).forEach(([pattern, commands]) => {
    if (match.isMatch(pattern, select)) {
      commands.forEach((command, index, commands) => {
        commands[index] = merge(command, newCommands);
      });
    }
  });

  return config;
};

module.exports.webp = (config) => {
  Object.entries(config).forEach(([pattern, commands]) => {
    let webp = [];
    commands.forEach(command => {
      webp.push(merge(command, {webp: {}, rename: {extname: '.webp'}}));
    });
    config[pattern] = [...commands, ...webp];
  });

  return config;
};
