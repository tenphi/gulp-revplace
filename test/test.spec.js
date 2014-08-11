'use strict';

require('mocha');

var fs = require('fs'),
  path = require('path'),
  es = require('event-stream'),
  gulp = require('gulp'),
  rev = require('gulp-rev'),
  rename = require('gulp-rename'),
  revplace = require('../index.js'),
  assert = require('chai').assert,
  inputDir = 'test/input',
  outputDir = 'test/output';

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

function shouldExist(file) {
  return assert.ok(fs.existsSync(path.join('test', 'output', file)), '`' + file + '` wasn\'t found in output');
}

function shouldNotExist(file) {
  return assert.ok(!fs.existsSync(path.join('test', 'output', file)), '`' + file + '` was found in output but it shouldn\'t be there');
}

describe('Test section', function() {

  before(function() {
    rmDir(outputDir);
  });

  it('should handle styles', function(cb) {
    gulp
      .src([inputDir + '/styles/style.css', inputDir + '/images/*.*'], { base: inputDir })
      .pipe(rev())
      .pipe(revplace())
      .pipe(gulp.dest(outputDir))
      .on('end', function() {
        shouldExist('styles/style-21373b83.css');
        shouldExist('images/ghost-61865acd.png');
        shouldExist('images/pumpkin-cb05ce1b.png');
        shouldNotExist('images/cat-5d0e5c9b.png');
        shouldNotExist('images/zombie-0dc22dba.png');
        compareFile('styles/style-21373b83.css', 'style.css');
        cb();
      });
  });

  it('should handle scripts', function(cb) {
    gulp
      .src([inputDir + '/scripts/script.js', inputDir + '/images/*.*'], { base: inputDir })
      .pipe(rev())
      .pipe(revplace())
      .pipe(gulp.dest(outputDir))
      .on('end', function() {
        shouldExist('scripts/script-6bc83506.js');
        shouldNotExist('images/ghost-61865acd.png');
        shouldNotExist('images/pumpkin-cb05ce1b.png');
        shouldExist('images/cat-5d0e5c9b.png');
        shouldExist('images/zombie-0dc22dba.png');
        compareFile('scripts/script-6bc83506.js', 'script.js');
        cb();
      });
  });

  it('should handle markup', function(cb) {
    gulp
      .src([inputDir + '/**/*.{html,js,css}'], { base: inputDir })
      .pipe(rev())
      .pipe(revplace())
      .pipe(gulp.dest(outputDir))
      .on('end', function() {
        shouldExist('scripts/script-6bc83506.js');
        shouldExist('styles/style-21373b83.css');
        shouldExist('index-16aa8b95.html');
        compareFile('scripts/script-6bc83506.js', 'script-unmodified.js');
        compareFile('styles/style-21373b83.css', 'style-unmodified.css');
        compareFile('index-16aa8b95.html', 'index.html');
        cb();
      });
  });

  it('should strip prefix from urls', function(cb) {
    gulp
      .src([inputDir + '/styles/style.css', inputDir + '/images/*.*'], { base: inputDir })
      .pipe(rev())
      .pipe(revplace({
        stripPrefix: '/strip/'
      }))
      .pipe(gulp.dest(outputDir))
      .on('end', function() {
        shouldExist('styles/style-21373b83.css');
        shouldExist('images/ghost-61865acd.png');
        shouldExist('images/pumpkin-cb05ce1b.png');
        shouldNotExist('images/cat-5d0e5c9b.png');
        shouldNotExist('images/zombie-0dc22dba.png');
        compareFile('styles/style-21373b83.css', 'style-strip.css');
        cb();
      });
  });

  it('should add prefix to urls', function(cb) {
    gulp
      .src([inputDir + '/styles/style.css', inputDir + '/images/*.*'], { base: inputDir })
      .pipe(rev())
      .pipe(revplace({
        addPrefix: '//'
      }))
      .pipe(gulp.dest(outputDir))
      .on('end', function() {
        shouldExist('styles/style-21373b83.css');
        shouldExist('images/ghost-61865acd.png');
        shouldExist('images/pumpkin-cb05ce1b.png');
        shouldNotExist('images/cat-5d0e5c9b.png');
        shouldNotExist('images/zombie-0dc22dba.png');
        compareFile('styles/style-21373b83.css', 'style-add.css');
        cb();
      });
  });

  it('should pass unmentioned assets if option was set', function(cb) {
    gulp
      .src([inputDir + '/images/*.*'], { base: inputDir })
      .pipe(rev())
      .pipe(revplace({
        skipUnmentioned: false
      }))
      .pipe(gulp.dest(outputDir))
      .on('end', function() {
        shouldExist('images/ghost-61865acd.png');
        shouldExist('images/pumpkin-cb05ce1b.png');
        shouldExist('images/cat-5d0e5c9b.png');
        shouldExist('images/zombie-0dc22dba.png');
        cb();
      });
  });

  it('should handle delimeters', function(cb) {
    gulp
      .src([inputDir + '/styles/style-delimeter.css', inputDir + '/images/*.*'], { base: inputDir })
      .pipe(rev())
      .pipe(revplace())
      .pipe(gulp.dest(outputDir))
      .on('end', function() {
        shouldExist('styles/style-delimeter-0a681edb.css');
        shouldExist('images/ghost-61865acd.png');
        shouldExist('images/pumpkin-cb05ce1b.png');
        shouldNotExist('images/cat-5d0e5c9b.png');
        shouldNotExist('images/zombie-0dc22dba.png');
        compareFile('styles/style-delimeter-0a681edb.css', 'style-delimeter.css');
        cb();
      });
  });

  it('should handle complex scenario', function(cb) {
    es.merge(
      gulp
        .src([inputDir + '/index.html'], { base: inputDir }),
      gulp
        .src([inputDir + '/*/**/*.*'], { base: inputDir })
        .pipe(rev())
    )
      .pipe(rename(function(path) {
        path.dirname = '';
      }))
      .pipe(revplace())
      .pipe(gulp.dest('test/output'))
      .on('end', function() {
        shouldExist('cat-5d0e5c9b.png');
        shouldExist('ghost-61865acd.png');
        shouldExist('index.html');
        shouldExist('pumpkin-cb05ce1b.png');
        shouldExist('script-6bc83506.js');
        shouldExist('style-21373b83.css');
        shouldExist('zombie-0dc22dba.png');
        compareFile('index.html', 'index-complex.html');
        compareFile('style-21373b83.css', 'style-complex.css');
        compareFile('script-6bc83506.js', 'script-complex.js');
        cb();
      });
  });

  afterEach(function() {
    rmDir(outputDir);
  });

});
