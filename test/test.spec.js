'use strict';

require('mocha');

var fs = require('fs'),
  path = require('path'),
  es = require('event-stream'),
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  size = require('gulp-size'),
  revplace = require('../index.js'),
  assert = require('chai').assert;

function rmDir(dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  fs.rmdirSync(dirPath);
}

function compareFile(sourceFile, matchFile) {
  if (!matchFile) {
    matchFile = sourceFile;
  }
  var matchDir = path.join('test', 'match');
  var sourceDir = path.join('test', 'output');
  try {
    var sourceContent = fs.readFileSync(path.join(sourceDir, sourceFile), 'utf-8');
    var matchContent = fs.readFileSync(path.join(matchDir, matchFile), 'utf-8');
  } catch(e) {
    assert.ok(false, 'file `' + sourceFile + '` not found');
  }
  assert.equal(sourceContent, matchContent);
}

function checkFile(file) {

  return assert.ok(fs.existsSync(path.join('test', 'output', file)), '`' + file + '` wasn\'t found in output');
}

describe('Test section', function() {

  beforeEach(function() {
    rmDir('test/output');
  });

  it('should collect assets with regular regexp', function(cb) {
    gulp.src('test/input/styles/style.css', { base: 'test/input' })
      .pipe(revplace({
        assets: gulp.src('test/input/images/*.{png,gif,jpg}', { base: 'test/input' }),
        assetPath: 'assets'
      }))
      .pipe(size({ showFiles: true }))
      .pipe(gulp.dest('test/output'))
      .on('end', function() {
        compareFile('style.css');
        checkFile('assets/ghost-6ce6c490.png');
        checkFile('assets/pumpkin-d5cb9db9.png');
        cb();
      });
  });

  it('should collect assets with custom regexp', function(cb) {
    gulp.src('test/input/scripts/script.js', { base: 'test/input' })
      .pipe(revplace({
        regex: /ASSET\(['"](.+)['"]\)/g,
        assets: gulp.src('test/input/images/*.{png,gif,jpg}', { base: 'test/input' }),
        assetPath: 'assets'
      }))
      .pipe(size({ showFiles: true }))
      .pipe(gulp.dest('test/output'))
      .on('end', function() {
        compareFile('script.js');
        checkFile('assets/cat-9121e197.png');
        checkFile('assets/zombie-b52ed4d8.png');
        cb();
      });
  });

  after(function() {
    rmDir('test/output');
  });

});
