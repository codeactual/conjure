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

function create() {
  return new ProcessBatch();
}

function ProcessBatch() {
  this.settings = {
    casperArgs: null,
    impulseBin: null,
    cliOptions: null,
    testDir: null
  };
  this.testFiles = [];
  this.allExitOk = true;
  this.exitsRemain = 0;
}

configurable(ProcessBatch.prototype);

ProcessBatch.prototype.push = function(file) {
  this.testFiles.push(file);
};

ProcessBatch.prototype.end = function(cmd, args) {
  var self = this;
  var batch = new Batch();
  var options = this.get('cliOptions');

  this.exitsRemain = this.testFiles.length;

  each(this.testFiles, function eachTestFile(testFile) {
    batch.push(self.spawnProcess.bind(self, testFile));
  });

  batch.concurrency(options.concurrency);
  batch.end();
};

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

ProcessBatch.prototype.onTimeout = function() {
  this.allExitOk = false;
};

ProcessBatch.prototype.updateStats = function(code) {
  this.allExitOk = this.allExitOk && 0 === code;
  if (!--this.exitsRemain) {
    process.exit(this.allExitOk ? 0 : 1);
  }
  this.get('impulseBin').verbose(
    'waiting for %s casperjs processes to finish', this.exitsRemain
  );
};

