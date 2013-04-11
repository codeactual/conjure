module.exports = function() {
  'use strict';

  var self = this;
  var requireComponent = require('../../component').require;
  var Batch = requireComponent('batch');
  var each = requireComponent('each');
  var spawn = this.child_process.spawn;

  if (!this.options.server) {
    this.options.outputHelp();
    process.exit(1);
  }

  var testServer = spawn(this.options.server);
  process.on('exit', function() { testServer.kill(); });

  var output = {}; // Index `casperjs` output/errors by test.
  var status = {}; // Index internal status JSON strings by type.
  var statusRe = /^conjure:([^:]+):(.*)$/;

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
  var tests = this.shelljs.findByRegex('.', grepFileRe);

  if (!tests.length) {
    this.verbose('No test files match %s', grepFileRe);
    process.exit();
  }

  // Resolve the test file paths after removing them just for the --grep-file.
  tests = tests.map(function(file) { return testDir + '/' + file; });
  this.verbose('Test files matching %s: %s', grepFileRe, tests.join(', '));

  // If any `casperjs` exits with an error code, `conjure` exits with 1.
  var exitsRemain = tests.length;
  var allExitOk = true;
  function onSpawnExit() {
    if (!--exitsRemain) {
      process.exit(allExitOk ? 0 : 1);
    }
    self.verbose('waiting for %s casperjs processes to finish', exitsRemain);
  }

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

  // Queue one runCasper() call per test script.
  var batch = new Batch();
  batch.concurrency(this.options.concurrency);
  each(tests, function(test) {
    batch.push(function(taskDone) {
      runCasper(test, taskDone);
    });
  });
  batch.end(); // Start dequeuing.

  /**
  * Run `casperjs`.
  *
  * @param {string} file
  * @param {function} cb Fires after `casperjs` exits.
  */
  function runCasper(file, cb) {
    var noTestsRan = false;

    var testRelPath = file.replace(testDir, '');
    output[testRelPath] = [];

    var stdout = self.createConsole(file, console.log, null);
    var stderr = self.createConsole(file, console.error, self.clc.red);

    var combinedArgs = [__dirname + '/../../../bootstrap.js'].concat(
      '--rootdir=' + self.options.rootDir,
      '--testdir=' + self.options.testDir,
      '--testfile=' + file,
      casperArgs
    );
    self.verbose('spawn: casperjs %s', combinedArgs.join(' '));

    var casper = spawn('casperjs', combinedArgs);

    casper.stdout.on('data', function(data) {
      data = data.toString().trim();

      if (/Looks like you didn't run any test/.test(data)) {
        self.verbose('No matching tests: %s', file);
        noTestsRan = true;
      }

      var statusMatch = data.match(statusRe);
      if (statusMatch) {
        var type = statusMatch[1];
        status[type] = status[type] || [];
        status[type].push(statusMatch[2]);
        return;
      }

      output[testRelPath].push({data: data});
    });

    casper.stderr.on('data', function(data) {
      output[testRelPath].push({err: true, data: data.toString()});
    });

    casper.on('exit', function(code) {
      // Skip output when --grep[v]-case excluded a file's entire suite.
      if (!noTestsRan || (!self.options.grepCase && !self.options.grepvCase)) {
        each(output[testRelPath], function(log) {
          if (log.err) {
            stderr(log.data);
          } else {
            stdout(log.data);
          }
        });
      }
      self.verbose('%s exited with code %d', file, code);
      allExitOk = allExitOk && 0 === code;
      onSpawnExit();
      cb();
    });

    if (self.options.timeout) {
      setTimeout(function() {
        allExitOk = false;
        casper.kill();
        stdout('Auto-killed %s after %dms timeout', file, self.options.timeout);

        var waitStatus = lastStatus('wait');
        if (waitStatus) {
          stdout('Potential timeout reason: %s', waitStatus);
        }
      }, self.options.timeout);
    }
  }

  function lastStatus(type) {
    var list = status[type];
    return list && list.length ? list[list.length - 1] : null;
  }
};
