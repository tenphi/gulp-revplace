
var path = require('path'),
  through = require('through2'),
  gutil = require('gulp-util'),
  chalk = require('chalk'),
  magic = new (require('mmmagic').Magic)();

var PLUGIN_NAME = 'gulp-revplace';

module.exports = function(opt) {

  /**
   * @type {{regex,addPrefix,stripPrefix}}
   */
  var opt = opt || {};

  var regex = opt.regex || /(?:url\(["']?(.*?)['"]?\)|src=["'](.*?)['"]|src=([^\s\>]+)(?:\>|\s)|href=["'](.*?)['"]|href=([^\s\>]+)(?:\>|\s)|ASSET\(['"](.+)['"]\))/g;
  var addPrefix = opt.addPrefix != null ? String(opt.addPrefix) : '/';
  var stripPrefix = opt.stripPrefix != null ? String(opt.stripPrefix).replace(/^\//, '') : '';
  var skipUnmentioned = opt.skipUnmentioned != null ? !!opt.skipUnmentioned : true;
  var verbose = opt.verbose != null ? !!opt.verbose : false;
  var assets = [];

  function fileHandler(file, enc, cb) {
    if (file.isNull()) return; // ignore
    if (file.isStream()) {
      throw new gutil.PluginError(PLUGIN_NAME,  'Streaming not supported');
    }

    assets.push(file);
    magic.detect(file.contents, function(err, result) {
      if (err) throw new gutil.PluginError(PLUGIN_NAME,  'Wrong content type of file `' + file.path + '`. ' + err);
      file.isTextType = !!~result.indexOf('ASCII');
      cb();
    });
  }

  function getNormalPath(path, base) {
    return path.split(base).slice(-1)[0].slice(1);
  }

  function endStream() {
    replaceUrls(this);
  }

  function replaceUrls(context) {
    var sources = assets.filter(function(file) {
      return file.isTextType;
    });

    sources.forEach(function(file) {
      var content = String(file.contents);

      content = content.replace(regex, function(str) {
        var found = Array.prototype.slice.call(arguments, 1).filter(function(a) {return a;})[0];
        var url = found.replace(/^\//, ''), suffix = '';
        var match = url.split(/[#\?]/);
        if (match) {
          suffix = url.replace(match[0], '');
          url = match[0];
        }
        if (stripPrefix && stripPrefix === url.slice(0, stripPrefix.length)) {
          url = url.replace(stripPrefix, '');
        }
        assets.forEach(function(asset) {
          if (asset === file || !asset.revOrigPath) {
            return;
          }

          var oldPath = getNormalPath(asset.revOrigPath, asset.revOrigBase);
          var newPath = getNormalPath(asset.path, asset.base);

          if (path.basename(oldPath) !== path.basename(url)) {
            return;
          }

          var absolutePath = oldPath;
          var relativePath = path.relative(path.dirname(file.revOrigPath || file.path), asset.revOrigPath);

          if (absolutePath === url || relativePath === url) {
            if (skipUnmentioned)
              context.push(asset);
            var replaced = addPrefix + newPath + suffix;
            str = str.replace(found, replaced);
            if (verbose)
              gutil.log('(' + chalk.blue(getNormalPath(file.path, file.base)) + ') ' + chalk.green(found) + ' ' + chalk.yellow('->') + ' ' + chalk.green(replaced));
          }
        });
        return str;
      });
      file.contents = new Buffer(content);
      if (skipUnmentioned)
        context.push(file);
    });

    if (!skipUnmentioned) {
      assets.forEach(function(asset) {
        context.push(asset);
      });
    }

    context.emit('end');
  }

  return through.obj(fileHandler, endStream);
};