
var path = require('path'),
  through = require('through2'),
  split = require('split2'),
  gutil = require('gulp-util'),
  chalk = require('chalk'),
  crypto = require('crypto');

var PLUGIN_NAME = 'gulp-revplacer';

module.exports = function(opt) {

  var opt = opt || {};

  var regex = opt.regex || /(?:url\(["']?(.*?)['"]?\)|src=["'](.*?)['"]|src=([^\s\>]+)(?:\>|\s)|href=["'](.*?)['"]|href=([^\s\>]+)(?:\>|\s))/g;
  var template = opt.template || '{name}-{hash}.{ext}';
  var assetPath = opt.assetPath != null ? String(opt.assetPath) : '';
  var urlPrefix = opt.urlPrefix != null ? String(opt.urlPrefix) : '/';
  var flatten = !!opt.flatten;
  var passAll = !!opt.passAll;
  var hashLength = opt.hashLength && opt.hashLength >= 4 && opt.hashLength <= 32 ? parseInt(opt.hashLength) : 8;
  var assets = [];

  var buffer = [];
  var sourcesLoaded = false,
    assetsLoaded = false,
    context = null;

  if (opt.assets && typeof(opt.assets.on) === 'function' && typeof(opt.assets.write) === 'function') {
    opt.assets.pipe(through.obj(generateContentHandler('asset'), function() {
      assetsLoaded = true;
      endStream();
    }));
  }

  function getBaseDir(file) {
    return file.origPath.split(file.origBase).slice(0, -1).join('');
  }

  function addAssetToOutput(asset, direct) {
    if (direct) {
      context.push(asset);
      return;
    }
    var basename = path.basename(asset.path);
    if (!asset.added) {
      var collision = false;
      assets.forEach(function(asset2) {
        if (asset2.added && path.basename(asset2.origPath) === basename) {
          collision = true;
        }
      });
      if (!collision) {
        var tmpPath = getFileNameWithHash(asset);
        if (assetPath) {
          tmpPath = path.join(assetPath, path.basename(tmpPath));
        }
        asset.path = path.join(getBaseDir(asset), tmpPath);
        asset.base = '.';
        basename = path.basename(asset.path);
        context.push(asset);
      }
      asset.added = true;
    }
    return assetPath ? path.join(assetPath, basename) : basename;
  }

  function getFileNameWithHash(file) {
    var filepath = file.origPath || file.path;
    var content = String(file.contents);
    var hash = crypto
      .createHash('md5')
      .update(content, 'utf8')
      .digest('hex')
      .slice(0, hashLength);
    var basename = path.basename(filepath);
    return template
      .replace('{hash}', hash)
      .replace('{name}', basename.slice(0, basename.lastIndexOf('.')))
      .replace('{ext}', path.extname(basename).slice(1));
  }

  function generateContentHandler(type, cb) {
    return function(file, enc, cb) {
      if (file.isNull()) return; // ignore
      if (file.isStream()) {
        throw new gutil.PluginError(PLUGIN_NAME,  'Streaming not supported');
      }

      file.origPath = file.origPath || file.path;
      file.origBase = file.origBase || file.base;
      file.origCwd = file.origCwd || file.cwd;

      file.type = type;
      if (type) {
        assets.push(file);
      }
      file.added = false;
      buffer.push(file);

      if (type === 'asset' && passAll) {
        addAssetToOutput(file, true);
      }

      cb();
    }
  }

  function endStream() {
    if (sourcesLoaded && assetsLoaded) {
      replaceUrls();
    }
  }

  function replaceUrls() {
    var sources = buffer.filter(function(file) {
      return file.type === 'source';
    });
    var assetsMap = {};
    var assets = buffer.filter(function(file) {
      var isAsset = file.type === 'asset';
      if (isAsset) {
        assetsMap[file.path] = file;
        file.cwd = path.dirname(file.path);
        file.base = '.';
      }
      return isAsset;
    });

    sources.forEach(function(file) {
      var content = String(file.contents);
      content = content.replace(regex, function(str) {
        var found = Array.prototype.slice.call(arguments, 1).filter(function(a) {return a;})[0];
        var url = found.replace(/^\//, '');
        assets.forEach(function(asset) {
          if (path.basename(asset.origPath) !== path.basename(url)) {
            return;
          }

          var absolutePath = asset.origPath
            .replace(path.join(asset.origCwd, asset.origBase), '')
            .replace(asset.origBase, '')
            .replace(/^\//, '');
          var relativePath = path.relative(path.dirname(file.origPath), asset.origPath);

          if (absolutePath === url || relativePath === url) {
            var tmpPath = addAssetToOutput(asset);
            var replaced = urlPrefix + tmpPath;
            str = str.replace(found, replaced);
          }
        });
        return str;
      });
      file.contents = new Buffer(content);
      if (flatten) {
        file.base = path.dirname(file.path);
      }
      context.push(file);
    });

    context.emit('end');
  }

  return through.obj(generateContentHandler('source'), function() {
    context = this;
    sourcesLoaded = true;
    endStream();
  });
};