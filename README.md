# @tigersway/gulp-responsive  ![GitHub last commit](https://img.shields.io/github/last-commit/tigersway/gulp-responsive?style=flat-square)  ![GitHub issues](https://img.shields.io/github/issues/tigersway/gulp-responsive?style=flat-square)

Generates all needed image sizes for responsive design

Complete rewrite of gulp-responsive & gulp-responsive-config, with dependencies updated and in only one package. Should also be able to apply any sharp command.

### Install  [![npm](https://img.shields.io/npm/v/@tigersway/gulp-responsive?style=flat-square)](https://www.npmjs.com/package/@tigersway/gulp-responsive)

```sh
$ npm install @tigersway/gulp-responsive
```

### Usage

Two Gulp&trade; plugins [gulp-newer](https://www.npmjs.com/package/gulp-newer) & [gulp-vinyl-flow](https://www.npmjs.com/package/gulp-vinyl-flow) may be of help.

#### Images to generate

```js
const { src, dest } = require('gulp');
const $ = require('gulp-load-plugins')({maintainScope: false});

const images = () => {

  return src('stock/images/*.{png,jpg}', {base:'stock'})
    .pipe($.responsive({
      '**/hero-*.jpg': [{
        resize: {width: 1200, height: 400},
        grayscale: {},
        rename: {suffix: '-1200x400'}
      },{
        resize: {width: 400},
        rename: {suffix: '-400x'}
      }],
      '**/*.jpg': {
        resize: {width: 400},
        rename: {suffix: '-400x'}
      },
      '**/*.tiff': {
        jpeg: {quality: 100},
        rename: {extname: 'jpg'}
      }
    // }))
    }, 'public/images')) // v1.5.0+ No need for gulp-newer anymore, if dest foolder set.
    // .pipe($.newer('public'))
    .pipe($.vinylFlow())
    .pipe(dest('public'))
  )
});
```

#### Images already defined (from html to images)

```js
const { src, dest } = require('gulp');
const $ = require('gulp-load-plugins')({maintainScope: false});

const images = () => {

  // build the configuration...
  let config = $.responsive.buildConfig(['**/*.{html,css}'], 'samples');

  return src('images/**/*.{png,jpg}')
      // ... and use it!
    .pipe($.responsive(config, 'public/images')) // v1.5.0+ No need for gulp-newer anymore, if dest foolder set.
    // .pipe($.responsive(config))
    // .pipe($.newer('public/images'))
    .pipe($.vinylFlow())
    .pipe(dest('public/images'))
  )
});
```

Supported filename formats for detection of dimensions

- `-<width>x[@<scale>x]` : image-200x.jpg or image-200x@2x.jpg
- `-x<height>[@<scale>x]`: image-x100.jpg or image-x100@2x.jpg
- `-<width>x<height>[@<scale>x]` : image-200x100.jpg or image-200x100@1.5x.jpg

Rename options: basename, prefix, suffix, extname

### Special thanks

+ [sharp](https://github.com/lovell/sharp) & [sharp-docs](https://sharp.pixelplumbing.com/)
+ [gulp-responsive](https://github.com/mahnunchik/gulp-responsive)
+ [gulp-rename](https://github.com/hparra/gulp-rename)
