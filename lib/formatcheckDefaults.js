var path = require('path'),
    _ = require('underscore');

var defaults = {
  'verbose': false,
  'checkedPart': "*",
  'failErrors': true,
  'failWarnings': false,
  'cacheChecks': true,
  'checkFile': '.format_checked.json',
  'failFile': 'format_failed.json'
}

function processConfig(config, src) {
  config = config || {};
  config = _.extend(_.clone(defaults), config);
  if (src) {
    config.checkFile = path.join(src, config.checkFile);
    config.failFile = path.join(src, config.failFile);
  }
  return config;
}

module.exports = {
  "defaults": defaults,
  "processConfig": processConfig
};
