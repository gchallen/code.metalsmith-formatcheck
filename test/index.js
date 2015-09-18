require('harmonize')(['harmony-generators']);

var metalsmith = require('metalsmith'),
    fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    chai = require('chai'),
    jsonfile = require('jsonfile'),
    async = require('async'),
    formatcheck = require('..'),
    formatcheckDefaults = require('../lib/formatcheckDefaults.js');

chai.use(require('chai-fs'));
var assert = chai.assert;

function reset_files(test_defaults) {
  try {
    fs.unlinkSync(test_defaults.checkFile);
  } catch (err) {};
  try {
    fs.unlinkSync(test_defaults.failFile);
  } catch (err) {};
  assert.notPathExists(test_defaults.checkFile);
  assert.notPathExists(test_defaults.failFile);
}

function check_files(files, defaults) {
  assert(!(defaults.checkFile in files));
  assert(!(defaults.failFile in files));
}

working = ['working.html']
broken = ['broken/1.html']
warning = ['warning/1.html']

describe('metalsmith-formatcheck', function() {
  it('should identify errors with the default parameters', function(done) {
    var src = 'test/fixtures/errors';
    var defaults = _.clone(formatcheckDefaults.defaults);
    var test_defaults = formatcheckDefaults.processConfig(defaults, path.join(src, 'src'));
    reset_files(test_defaults);

    metalsmith(src)
      .use(formatcheck(defaults))
      .build(function (err, files) {
        if (!err) {
          return done(new Error("should fail"));
        }
        assert.pathExists(test_defaults.checkFile);
        var checked = jsonfile.readFileSync(test_defaults.checkFile);
        assert.deepEqual(_.keys(checked).sort(), working.sort());
        
        assert.pathExists(test_defaults.failFile);
        var failures = jsonfile.readFileSync(test_defaults.failFile);
        assert.deepEqual(_.keys(failures).sort(), broken.sort());

        done();
      });
  });
  it('should identify warnings with the default parameters', function(done) {
    var src = 'test/fixtures/warnings';
    var defaults = _.clone(formatcheckDefaults.defaults);
    var test_defaults = formatcheckDefaults.processConfig(defaults, path.join(src, 'src'));
    reset_files(test_defaults);

    metalsmith(src)
      .use(formatcheck(defaults))
      .build(function (err, files) {
        if (err) {
          return done(err);
        }
        assert.pathExists(test_defaults.checkFile);
        var checked = jsonfile.readFileSync(test_defaults.checkFile);
        assert.deepEqual(_.keys(checked).sort(), working.sort());
        
        assert.pathExists(test_defaults.failFile);
        var failures = jsonfile.readFileSync(test_defaults.failFile);
        assert.deepEqual(_.keys(failures).sort(), warning.sort());

        done();
      });
  });
  it('should fail warnings when asked to', function(done) {
    var src = 'test/fixtures/warnings';
    var defaults = _.clone(formatcheckDefaults.defaults);
    defaults.failWarnings = true;
    var test_defaults = formatcheckDefaults.processConfig(defaults, path.join(src, 'src'));
    reset_files(test_defaults);

    metalsmith(src)
      .use(formatcheck(defaults))
      .build(function (err, files) {
        if (!err) {
          return done(new Error("should fail"));
        }
        assert.pathExists(test_defaults.checkFile);
        var checked = jsonfile.readFileSync(test_defaults.checkFile);
        assert.deepEqual(_.keys(checked).sort(), working.sort());
        
        assert.pathExists(test_defaults.failFile);
        var failures = jsonfile.readFileSync(test_defaults.failFile);
        assert.deepEqual(_.keys(failures).sort(), warning.sort());

        done();
      });
  });
  it('should not fail when encountering broken pages and asked not to', function(done) {
    var src = 'test/fixtures/errors';
    var defaults = _.clone(formatcheckDefaults.defaults);
    defaults.failErrors = false;
    var test_defaults = formatcheckDefaults.processConfig(defaults, path.join(src, 'src'));
    reset_files(test_defaults);

    metalsmith(src)
      .use(formatcheck(defaults))
      .build(function (err, files) {
        if (err) {
          return done(err);
        }
        assert.pathExists(test_defaults.checkFile);
        var checked = jsonfile.readFileSync(test_defaults.checkFile);
        assert.deepEqual(_.keys(checked).sort(), working.sort());
        
        assert.pathExists(test_defaults.failFile);
        var failures = jsonfile.readFileSync(test_defaults.failFile);
        assert.deepEqual(_.keys(failures).sort(), broken.sort());

        check_files(files, defaults);
        done();
      });
  });
  it('should cache format checks when told to', function(done) {
    var src = 'test/fixtures/errors';
    var defaults = _.clone(formatcheckDefaults.defaults);
    var test_defaults = formatcheckDefaults.processConfig(defaults, path.join(src, 'src'));
    reset_files(test_defaults);
    
    var check;
    async.series([
        function (callback) {
          metalsmith(src)
            .use(formatcheck(defaults))
            .build(function (err, files) {
              if (!err) {
                return done(new Error("should fail"));
              }
              assert.pathExists(test_defaults.checkFile);
              check = jsonfile.readFileSync(test_defaults.checkFile);
              assert.deepEqual(_.keys(check).sort(), working.sort());

              assert.pathExists(test_defaults.failFile);
              var failures = jsonfile.readFileSync(test_defaults.failFile);
              assert.deepEqual(_.keys(failures).sort(), broken.sort());

              callback();
            });
        },
        function (callback) {
          metalsmith(src)
            .use(formatcheck(defaults))
            .build(function (err, files) {
              if (!err) {
                return done(new Error("should fail"));
              }
              assert.pathExists(test_defaults.checkFile);
              var second_check = jsonfile.readFileSync(test_defaults.checkFile);
              assert.deepEqual(_.keys(check).sort(), working.sort());
              assert.deepEqual(second_check, check);

              assert.pathExists(test_defaults.failFile);
              var failures = jsonfile.readFileSync(test_defaults.failFile);
              assert.deepEqual(_.keys(failures).sort(), broken.sort());

              done();
            });
        }
    ]);
  });
});
