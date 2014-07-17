# [gulp](http://gulpjs.com)-revplace

Ultimate asset collector for gulp.

## Install

```bash
$ npm install --save-dev gulp-revplace
```


## Usage

```js
var gulp = require('gulp');
var revplace = require('gulp-revplace');

gulp.task('default', function () {
  return gulp.src('static/styles/main.css')
    .pipe({
      urlPrefix: '//cdn.example.com/static/',
      assets: gulp.src('static/images/*.*'),
      assetPath: '/assets'
    })
    .pipe(gulp.dest('build'));
});
```


## API

### revplace(options)

#### assets

_Type_: `Stream`

_Usage_: Gulp-stream where plugin should find assets

#### assetPath

_Type_: `String`

_Usage_: Output path for assets (relative)

_Default_: none

#### regex

_Type_: [`RegExp`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp)

_Usage_: Sets a custom regex to match on your files.

_Default_: `/(?:url\(["']?(.*?)['"]?\)|src=["'](.*?)['"]|src=([^\s\>]+)(?:\>|\s)|href=["'](.*?)['"]|href=([^\s\>]+)(?:\>|\s))/g`

#### template
_Type_: `String`

_Usage_: Template to generate output filename

_Default_: `{name}-{hash}.{ext}`

#### urlPrefix
_Type_: `String`

_Usage_: Prefix for replaced paths

_Default_: `/`

#### flatten
_Type_: `Boolean`

_Usage_: If TRUE after `gulp.dest` all souce files will be in one directory

#### passAll
_Type_: `Boolean`

_Usage_: if TRUE all assets will pass through stream no matter they are referenced or not

## License

[MIT](http://opensource.org/licenses/MIT) © [Andrey Yamanov](http://tenphi.me)
