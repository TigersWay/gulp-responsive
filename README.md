# @tigersway/gulp-responsive ![GitHub package.json version](https://img.shields.io/github/package-json/v/tigersway/gulp-responsive?style=flat-square) ![GitHub last commit](https://img.shields.io/github/last-commit/tigersway/gulp-responsive?style=flat-square)
Generates all needed image sizes for responsive design

Complete rewrite of gulp-responsive & gulp-responsive-config, with dependencies updated and in only one package. Should also be able to apply any sharp command.

## Usage

### Images to generate

```javascript
const { src, dest } = require('gulp');
const $ = require('gulp-load-plugins')({maintainScope: false});

const images = () => {

  return src('stock/images/*.{png,jpg}', {base:'stock})
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
    }, {
      // withMetadata: false,
      // errorOnEnlargement: true,
      // quality: 80,
      // compressionLevel: 6,
      // max: true
    }))
    .pipe(dest('public'))
  )
});
```

### Images already defined (from html to images)

```javascript
const { src, dest } = require('gulp');
const $ = require('gulp-load-plugins')({maintainScope: false});

const images = () => {

  // build the configuration...
  let config = $.responsive.buildConfig(['**/*.{html,css}'], {cwd:'samples'});

  return src('images/*.{png,jpg}')
      // ... and use it!
    .pipe($.responsive(config, {
      // withMetadata: false,
      // errorOnEnlargement: true,
      // quality: 80,
      // compressionLevel: 6,
      // max: true
    }))
    .pipe(dest('public/images'))
  )
});
```

Supported filename formats for detection of dimensions

- `-<width>x[@<scale>x]` : image-200x.jpg or image-200x@2x.jpg
- `-x<height>[@<scale>x]`: image-x100.jpg or image-x100@2x.jpg
- `-<width>x<height>[@<scale>x]` : image-200x100.jpg or image-200x100@1.5x.jpg

Rename options: basename, prefix, suffix, extname

## Special thanks

+ [sharp](https://github.com/lovell/sharp) & [sharp-docs](https://sharp.pixelplumbing.com/)
+ [gulp-responsive](https://github.com/mahnunchik/gulp-responsive)
+ [gulp-rename](https://github.com/hparra/gulp-rename)
