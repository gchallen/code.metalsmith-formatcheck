var debug = require('debug')('metalsmith-formatcheck'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    _ = require('underscore'),
    jsonfile = require('jsonfile'),
    request = require('request'),
    validator = require('html-validator'),
    MD5 = require('MD5'),
    cheerio = require('cheerio'),
    formatcheckDefaults = require('./formatcheckDefaults.js');

module.exports = function(config) {

  return function(files, metalsmith, done) {

    config = formatcheckDefaults.processConfig(metalsmith.source(), config);

    var metadata = metalsmith.metadata();

    var htmlfiles = _.pick(files, function(file, filename) {
      return (path.extname(filename) === '.html');
    });
     
    var checked_files = {}, errors = {}, failures = {}, warnings = {};
    if (config.cacheChecks) {
      try {
        checked_files = jsonfile.readFileSync(config.checkFile);
      } catch (err) {};
    }
    
    async.series([
        function (callback) {
          request("http://www.google.com", function (error, response, body) {
            if (error || !response || response.statusCode != 200) {
              done(new Error("network failure"));
              return;
            } else {
              callback();
            }
          });
        },
        function (callback) {
          async.forEachOfLimit(htmlfiles, 4, function (file, filename, finished) {

            var file_hash = MD5(cheerio.load(file.contents).html());
            if (checked_files[filename] && checked_files[filename] == file_hash) {
              finished();
              return;
            }

            validator({ format: 'text', data: file.contents}, function (err, data) {
              if (err) {
                failures[filename] = err;
              } else if (data.indexOf("Warning:") !== -1) {
                warnings[filename] = data;
              } else if (data.indexOf("There were errors.") !== -1) {
                errors[filename] = data;
              } else {
                checked_files[filename] = file_hash;
              }
              finished();
            });
          }, function () {
            if (config.cacheChecks && _.keys(checked_files).length > 0) {
              jsonfile.writeFileSync(config.checkFile, checked_files);
            }
            var problems = _.extend(_.clone(failures), warnings, errors);
            if (_.keys(problems).length > 0) {
              if (config.verbose) {
                console.log("There were format errors. See " + config.failFile);
              }
              jsonfile.writeFileSync(config.failFile, problems);
            } else {
              try {
                fs.unlinkSync(config.failFile);
              } catch (err) {};
            }
            if ((problems.length > 0 && (problems.length != warnings.length) && config.failErrors) ||
                (warnings.length > 0 && config.failWarnings)) {
              done(new Error("failed format check: " + _.keys(problems)));
            } else {
              done();
            }
          });
        }
    ]);
  }
};

