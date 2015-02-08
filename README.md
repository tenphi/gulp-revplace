# [gulp](http://gulpjs.com)-revplace

Simple helper for [gulp-rev](http://github.com/sindresorhus/gulp-rev) to fix all asset references. It works with relative urls too! By default it doesn't pass through assets that are not mentioned in source files. This plugin can be very useful in your build scenarios.

## Install

```bash
$ npm install --save-dev gulp-revplace
```

## Usage

Structure before rev:

```bash
.
├── build
└── static
    ├── images
    │   ├── cat.png
    │   ├── ghost.png
    │   ├── pumpkin.png
    │   └── zombie.png
    ├── index.html
    ├── scripts
    │   └── script.js
    └── styles
        └── style.css
```

`script.js` and `style.css` have references to all images. `index.html` have references to `script.js` and `style.css`.

```css
/* style.css */
.first { background-image: url(/images/ghost.png); }
.second { background-image: url(/images/pumpkin.png); }
.third { background-image: url(../images/pumpkin.png); }
```

```javascript
// script.js
(function() {
  var absoluteImageUrl = ASSET('/images/cat.png');
  var relativeImageUrl = ASSET('../images/cat.png');
  var absoluteImageUrl2 = ASSET('/images/zombie.png');
})();
```

```html
<!-- index.html -->
<!doctype html>
<html>
<head>
  <link type="text/css" rel="stylesheet" href="styles/style.css"/>
  <script src="scripts/script.js"></script>
</head>
<body></body>
</html>
```

Let's make simple gulp task:

```javascript
var gulp = require('gulp');
var rev = require('gulp-rev');
var revplace = require('gulp-revplace');
var es = require('event-stream');
var baseDir = 'static';

gulp.task('default', function () {
  return es.merge(
    gulp
      .src([baseDir + '/index.html'], { base: baseDir }),
    gulp
      .src([baseDir + '/*/**/*.*'], { base: baseDir })
      .pipe(rev())
  )
    .pipe(revplace())
    .pipe(gulp.dest('build'));
});
```

After execution file names will be changed and all references will be replaced.

```bash
.
├── build
│   ├── images
│   │   ├── cat-1ccfa741.png
│   │   ├── ghost-aa908d61.png
│   │   ├── pumpkin-5ca50d04.png
│   │   └── zombie-68157885.png
│   ├── index.html
│   ├── scripts
│   │   └── script-921c4eaf.js
│   └── styles
│       └── style-cc726e1b.css
└── static
    ├── images
    │   ├── cat.png
    │   ├── ghost.png
    │   ├── pumpkin.png
    │   └── zombie.png
    ├── index.html
    ├── scripts
    │   └── script.js
    └── styles
        └── style.css
```

```css
/* style.css */
.first { background-image: url(/images/ghost-61865acd.png); }
.second { background-image: url(/images/pumpkin-cb05ce1b.png); }
.third { background-image: url(/images/pumpkin-cb05ce1b.png); }
```

```javascript
// script.js
(function() {
  var absoluteImageUrl = ASSET('/images/cat-5d0e5c9b.png');
  var relativeImageUrl = ASSET('/images/cat-5d0e5c9b.png');
  var absoluteImageUrl2 = ASSET('/images/zombie-0dc22dba.png');
})();
```

```html
<!-- index.html -->
<!doctype html>
<html>
<head>
  <title>Test page</title>
  <link type="text/css" rel="stylesheet" href="/styles/style-21373b83.css"/>
  <script src="/scripts/script-6bc83506.js"></script>
</head>
<body></body>
</html>
```

You can even change `dirname`s of your files. It will also work like a charm.

```javascript
gulp.task('default', function () {
  return es.merge(
    gulp
      .src([baseDir + '/index.html'], { base: baseDir }),
    gulp
      .src([baseDir + '/*/**/*.*'], { base: baseDir })
      .pipe(rev())
  )
    .pipe(rename(function(path) {
      path.dirname = '';
    }))
    .pipe(revplace())
    .pipe(gulp.dest('build'));
});
```

Structure will be changed...

```
.
├── cat-5d0e5c9b.png
├── ghost-61865acd.png
├── index.html
├── pumpkin-cb05ce1b.png
├── script-6bc83506.js
├── style-21373b83.css
└── zombie-0dc22dba.png
```

...as well as file references.

```css
/* style.css */
.first { background-image: url(/ghost-61865acd.png); }
.second { background-image: url(/pumpkin-cb05ce1b.png); }
.third { background-image: url(/pumpkin-cb05ce1b.png); }
```

```javascript
// script.js
(function() {
  var absoluteImageUrl = ASSET('/cat-5d0e5c9b.png');
  var relativeImageUrl = ASSET('/cat-5d0e5c9b.png');
  var absoluteImageUrl2 = ASSET('/zombie-0dc22dba.png');
})();
```

```html
<!-- index.html -->
<!doctype html>
<html>
<head>
  <title>Test page</title>
  <link type="text/css" rel="stylesheet" href="/style-21373b83.css"/>
  <script src="/script-6bc83506.js"></script>
</head>
<body></body>
</html>
```

## API

### revplace(options)

#### regex

_Type_: [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

_Usage_: Sets a custom regex to match on your files.

_Default_: `/(?:url\(["']?(.*?)['"]?\)|src=["'](.*?)['"]|src=([^\s\>]+)(?:\>|\s)|href=["'](.*?)['"]|href=([^\s\>]+)(?:\>|\s)|ASSET\(['"](.+)['"]\))/g`

You can define and use simple ASSET() function that only returns what it was given. Use it to declare asset urls in scripts. It'll help plugin to find all assets.

```javascript
function ASSET(s) {return s;}
```

#### addPrefix
_Type_: `String`

_Usage_: Add prefix to replaced urls

_Default_: `/`

#### stripPrefix
_Type_: `String`

_Usage_: Strip prefix from initial urls

#### skipUnmentioned
_Type_: `Boolean`

_Usage_: If TRUE only assets that are mentioned in source files will be passed through stream. Source files are always passed.

_Default_: true

#### verbose
_Type_: `Boolean`

_Usage_: Activate verbose mode

## License

[MIT](http://opensource.org/licenses/MIT) © [Andrey Yamanov](http://tenphi.me)
