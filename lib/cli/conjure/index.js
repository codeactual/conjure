module.exports = function() {
  'use strict';

  if (!this.options.server) {
    this.options.outputHelp();
    process.exit(1);
  }

  var requireComponent = require('../../..').require;
  var each = requireComponent('each');

  var testServer = require('child_process').spawn(this.options.server);
  process.on('exit', function() { testServer.kill(); });

  // Recursively find matching test scripts.
  // Use cd() so we can just apply --grep-file to paths relative to the test dir.
  var testDir = this.options.rootDir + '/' + this.options.testDir;
  this.verbose('Test directory: %s', testDir);

  if (!this.shelljs._('test', '-d', testDir)) {
    console.error('Test directory not found: ' + testDir);
    process.exit(1);
  }
  this.shelljs._('cd', testDir);

  var grepFileRe = new RegExp(this.options.grepFile);
  var testFiles = this.shelljs.findByRegex('.', grepFileRe);

  if (!testFiles.length) {
    this.verbose('No test files match %s', grepFileRe);
    process.exit();
  }

  // Resolve the test file paths after removing them just for the --grep-file.
  testFiles = testFiles.map(function(file) { return testDir + '/' + file; });
  this.verbose('Test files matching %s: %s', grepFileRe, testFiles.join(', '));

  var casperArgs = [];

  if (this.options.bootstrap) {
    casperArgs.push('--bootstrap=' + this.options.bootstrap);
  }

  if (this.options.grepCase) {
    casperArgs.push('--grep');
    casperArgs = casperArgs.concat(this.args);
  } else if (this.options.grepvCase) {
    casperArgs.push('--grepv');
    casperArgs = casperArgs.concat(this.args);
  }

  var batch = require('./process-batch').create();
  batch
    .set('cliMod', this)
    .set('cliOptions', this.options)
    .set('casperArgs', casperArgs)
    .set('testDir', testDir);
  each(testFiles, function(file) {
    batch.push(file);
  });
  batch.end();
};
