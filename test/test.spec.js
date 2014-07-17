'use strict';

require('mocha');

var fs = require('fs'),
  path = require('path'),
  es = require('event-stream'),
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  size = require('gulp-size'),
  revplacer = require('../index.js'),
  assert = require('chai').assert;

describe('Test section', function() {

  it('should be tested', function(cb) {
    gulp.src('test/input/styles/app.css', { base: 'test/input' })
      .pipe(revplacer({
        assets: gulp.src('test/input/images/*.{png,gif,jpg}', { base: 'test/input' }),
        assetPath: ''
      }))
      .pipe(size({ showFiles: true }))
      .pipe(gulp.dest('test/output'))
      .on('end', cb);
  });

});
