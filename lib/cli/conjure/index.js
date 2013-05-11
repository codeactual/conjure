exports.init = function(provider) {
  provider
    .option('-s, --server <script>', 'Test server startup script', String)
    .option('-c, --concurrency <num>', 'casperjs process count [2]', Number, 2)
    .option('-r, --root-dir <dir>', 'Project root directory [cwd]', String, process.cwd())
    .option('-t, --test-dir <dir>', 'Test directory, relative to root [test]', String, 'test')
    .option('-f, --grep-file <regex>', 'Test file regex filter [.js]', String, '\\.js$')
    .option('-b, --bootstrap <file>', 'Bootstrap all test modules [none]', String)
    .option('-T, --timeout <ms>', 'Max run time of a casperjs process', Number, 5000)
    .option('-v, --verbose')
    .option('-g, --grep-case', 'Filter test cases with RegExp built from arguments [none]')
    .option('-S, --full-trace', 'On error, show full stack traces instead of last it()')
    .option('-G, --grepv-case', 'Omit test cases with RegExp built from arguments [none]');
};

exports.run = function() {
  'use strict';

  var self = this;

  if (!this.options.server) {
    this.options.outputHelp();
    process.exit(1);
  }

  var requireComponent = require('../../..').requireComponent;
  var each = requireComponent('each');

  var testServer = require('child_process').spawn(this.options.server);
  process.on('exit', function onConjureExit() {
    // In case `--server` is just thin launcher.
    self.shelljs._('exec', 'pkill -TERM -P ' + testServer.pid);

    testServer.kill();
  });
  process.on('error', onError.bind(this));

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

  this.verbose('PHANTOMJS_EXECUTABLE: %s', process.env.PHANTOMJS_EXECUTABLE);

  var batch = require('./process-batch').create();
  batch
    .set('impulseBin', this)
    .set('cliOptions', this.options)
    .set('casperArgs', casperArgs)
    .set('testDir', testDir);
  each(testFiles, function conjureOnEachTestFile(file) {
    batch.push(file);
  });
  batch.end();
};

/**
 * Handle `conjure` errors.
 *
 * @param {object} `Error`
 * @api private
 */
function onError(err) {
  this.stderr('error event: %s', err.toString());
}
