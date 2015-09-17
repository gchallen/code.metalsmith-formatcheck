var path = require('path'),
    _ = require('underscore');

var defaults = {
  'verbose': false,
  'failErrors': true,
  'failWarnings': false,
  'cacheChecks': true,
  'checkFile': '.format_checked.json',
  'failFile': 'format_failed.json'
}

function processConfig(src, config) {
  config = config || {};
  config = _.extend(_.clone(defaults), config);
  config.checkFile = path.join(src, config.checkFile);
  config.failFile = path.join(src, config.failFile);
  return config;
}

module.exports = {
  "defaults": defaults,
  "processConfig": processConfig
};
