var debug = require('debug')('metalsmith-formatcheck'),
    path = require('path'),
    fs = require('fs'),
    async = require('async'),
    _ = require('underscore'),
    jsonfile = require('jsonfile'),
    request = require('request'),
    validator = require('html-validator'),
    MD5 = require('md5'),
    cheerio = require('cheerio'),
    formatcheckDefaults = require('./formatcheckDefaults.js');

function removeFiles(files, config) {
  if (files[config.checkFile]) {
    delete(files[config.checkFile]);
  }
  if (files[config.failFile]) {
    delete(files[config.failFile]);
  }
};

module.exports = function(config) {

  return function(files, metalsmith, done) {

    config = formatcheckDefaults.processConfig(config);

    var metadata = metalsmith.metadata();

    var htmlfiles = _.pick(files, function(file, filename) {
      return (path.extname(filename) === '.html');
    });
     
    var checked_files = {}, errors = {}, failures = {}, warnings = {};
    if (config.cacheChecks) {
      try {
        checked_files = JSON.parse(files[config.checkFile].contents);
      } catch (err) {};
    }
    
    async.series([
        function (callback) {
          request("http://www.google.com", function (error, response, body) {
            if (error || !response || response.statusCode != 200) {
              removeFiles(files, config);
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
              jsonfile.writeFileSync(path.join(metalsmith.source(), config.checkFile), checked_files);
            }
            var problems = _.extend(_.clone(failures), warnings, errors);
            if (_.keys(problems).length > 0) {
              if (config.verbose) {
                console.log("There were format errors. See " + config.failFile);
              }
              jsonfile.writeFileSync(path.join(metalsmith.source(), config.failFile), problems);
            } else {
              try {
                fs.unlinkSync(path.join(metalsmith.source(), config.failFile));
              } catch (err) {};
            }
            problems = _.keys(problems);
            warnings = _.keys(warnings);
            if ((problems.length > 0 && (problems.length != warnings.length) && config.failErrors) ||
                (warnings.length > 0 && config.failWarnings)) {
              removeFiles(files, config);
              done(new Error("failed format check: " + problems));
            } else {
              removeFiles(files, config);
              done();
            }
          });
        }
    ]);
  }
};

