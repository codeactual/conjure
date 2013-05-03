/**
 * Reference to ProcessBatch.
 */
exports.ProcessBatch = ProcessBatch;

/**
 * Create a new ProcessBatch.
 *
 * @return {object}
 */
exports.create = function() { return new ProcessBatch(); };

var requireComponent = require('../../..').requireComponent;
var Batch = requireComponent('batch');
var configurable = requireComponent('configurable.js');
var each = requireComponent('each');

/**
 * ProcessBatch constructor.
 *
 * Configuration:
 *
 * - `{object} casperArgs` Base arguments for new `casperjs` child process
 * - `{object} cliOptions`
 * - `{object} impulseBin` `ImpulseBin` instance
 * - `{string} testDir` Root test directory
 *
 * Properties:
 *
 * - `{array} testFiles` Filenames to pass to individual `casperjs` processes
 * - `{boolean} allExitOk` True of all `casperjs` processes exited with 0
 * - `{number} exitsRemain` Starts at `testFiles.length`, decrements on a `casperjs` exit
 *
 * @see ImpulseBin https://github.com/codeactual/impulse-bin/blob/master/docs/ImpulseBin.md
 */
function ProcessBatch() {
  this.settings = {
    casperArgs: null,
    cliOptions: null,
    impulseBin: null,
    testDir: null
  };
  this.testFiles = [];
  this.allExitOk = true;
  this.exitsRemain = 0;
}

configurable(ProcessBatch.prototype);

/**
 * Add a test file.
 *
 * @param {string} file
 */
ProcessBatch.prototype.push = function(file) {
  this.testFiles.push(file);
};

/**
 * End test file collection and execute the batch.
 */
ProcessBatch.prototype.end = function() {
  var self = this;
  var batch = new Batch();
  var options = this.get('cliOptions');

  this.exitsRemain = this.testFiles.length;

  each(this.testFiles, function conjureBatchOnEachTestFile(testFile) {
    batch.push(self.spawnProcess.bind(self, testFile));
  });

  batch.concurrency(options.concurrency);
  batch.end();
};

/**
 * Spawn `casperjs` for the current test file.
 *
 * `Batch#push` compatible function.
 *
 * @param {string} testFile
 * @param {function} onExit Fire when `casperjs` exits.
 * - Signals to the batch processor that another task can start.
 * @api private
 */
ProcessBatch.prototype.spawnProcess = function(testFile, onExit) {
  var options = this.get('cliOptions');
  var spawnArgs = [__dirname + '/../../../bootstrap.js'].concat(
    '--rootdir=' + options.rootDir,
    '--testdir=' + options.testDir,
    '--testfile=' + testFile,
    this.get('casperArgs')
  );

  var p = require('./process').create();
  p
    .set('impulseBin', this.get('impulseBin'))
    .set('cliOptions', options)
    .set('label', testFile.replace(this.get('testDir'), ''))
    .set('spawnArgs', spawnArgs)
    .spawn();

  p.on('timeout', this.onTimeout.bind(this));
  p.on('exit', this.updateStats.bind(this));
  p.on('exit', onExit);
};

/**
 * `Process` timeout event handler.
 *
 * @see [Process](Process.md)
 * @api private
 */
ProcessBatch.prototype.onTimeout = function() {
  this.allExitOk = false;
};

/**
 * Update stats like `allExitOk` after a `casperjs` process exits.
 *
 * @param {number} code Exit code
 * @api private
 */
ProcessBatch.prototype.updateStats = function(code) {
  this.allExitOk = this.allExitOk && 0 === code;
  if (!--this.exitsRemain) {
    process.exit(this.allExitOk ? 0 : 1);
  }
  this.get('impulseBin').verbose(
    'waiting for %s casperjs processes to finish', this.exitsRemain
  );
};

