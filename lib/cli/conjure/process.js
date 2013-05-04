/**
 * Reference to Process.
 */
exports.Process = Process;

/**
 * Create a new Process.
 *
 * @return {object}
 */
exports.create = function() { return new Process(); };

var spawn = require('child_process').spawn;
var events = require('events');
var util = require('util');

var requireComponent = require('../../..').requireComponent;
var configurable = requireComponent('configurable.js');
var each = requireComponent('each');
var processData = require('./process-data');
var statusList = require('./status-list');

/**
 * Process constructor.
 *
 * Configuration:
 *
 * - `{object} impulseBin` `ImpulseBin` instance
 * - `{object} cliOptions`
 * - `{array} spawnArgs`
 * - `{string} label` Ex. name of the test file, used for logging
 * - `{string} testDir` Root test directory
 *
 * Properties:
 *
 * - `{object} data` `ProcessData` instance that holds stdout/stderr
 * - `{object} handle` `ChildProcess` instance
 * - `{boolean} noTestsRan` True if caused by `--grep-case` or `--grepv-case`
 * - `{object} statusList` `StatusList` instance that holds internal messages parsed from stdout
 * - `{object} timeoutId` `setTimeout()` ID created in Process.prototype.spawn to enforce `--timeout`
 *
 * Inherits:
 *
 * - `events.EventEmitter`
 *
 * @see ImpulseBin https://github.com/codeactual/impulse-bin/blob/master/docs/ImpulseBin.md
 * @see [ProcessData](ProcessData.md)
 * @see [StatusList](StatusList.md)
 */
function Process() {
  this.settings = {
    impulseBin: null,
    cliOptions: null,
    spawnArgs: null,
    label: null,
    testDir: null
  };
  this.data = processData.create();
  this.handle = null;
  this.noTestsRan = false;
  this.statusList = statusList.create(); // Internal status events, hidden from console
  this.timeoutId = null;

  events.EventEmitter.call(this);
}

util.inherits(Process, events.EventEmitter);
configurable(Process.prototype);

/**
 * Spawn a single process based on collected configuration.
 */
Process.prototype.spawn = function() {
  var label = this.get('label');
  var impulseBin = this.get('impulseBin');
  var options = this.get('cliOptions');
  var spawnArgs = this.get('spawnArgs');

  impulseBin.console.set('verboseLogName', label);
  this.stdout = impulseBin.console.create(label, console.log);
  this.stderr = impulseBin.console.create(label, console.error, 'red');
  this.verbose = impulseBin.createVerbose(console.log);
  this.data.set('label', label);

  this.verbose('spawn: casperjs %s', spawnArgs.join(' '));

  this.handle = spawn('casperjs', spawnArgs);
  this.handle.on('exit', this.onExit.bind(this));
  this.handle.on('error', this.onError.bind(this));
  this.handle.stderr.on('data', this.onStderr.bind(this));
  this.handle.stdout.on('data', this.onStdout.bind(this));

  this.statusList.set('impulseBin', this.get('impulseBin'));

  if (options.timeout) {
    this.timeoutId = setTimeout(this.onTimeout.bind(this), options.timeout);
  }
};

/**
 * Handle timeout of spawned process.
 *
 * Duration based on `--timeout`.
 *
 * @api private
 */
Process.prototype.onTimeout = function() {
  this.emit('timeout');
  this.handle.kill();
  this.stdout('Auto-killed after %dms timeout', this.get('cliOptions').timeout);
  this.showTrace();
};

/**
 * Handle errors of spawned process.
 *
 * @param {object} `Error`
 * @api private
 */
Process.prototype.onError = function(err) {
  this.stderr('error event: %s', err.toString());
};

/**
 * Handle exit of spawned process.
 *
 * @param {number} code
 * @api private
 */
Process.prototype.onExit = function(code) {
  var self = this;
  var label = this.get('label');
  var options = this.get('cliOptions');

  if (this.timeoutId) { clearTimeout(this.timeoutId); }

  // Skip output when --grep[v]-case excluded a file's entire suite.
  if (!this.noTestsRan || (!options.grepCase && !options.grepvCase)) {
    this.data.each(function conjureProcessOnEachDataItem(log) {
      if (log.err) {
        self.stderr(log.data);
      } else {
        self.stdout(log.data);
      }
    });
  }

  if (code) { // Test did not pass (any reason)
    this.showTrace();
  }

  this.verbose('%s exited with code %d', label, code);
  this.emit('exit', code);
};

/**
 * `ChildProcess.stderr.on()` handler.
 *
 * @param {object} data `Buffer` instance
 * @api private
 */
Process.prototype.onStderr = function(data) {
  this.data.push({err: true, data: data.toString()});
};

/**
 * `ChildProcess.stdout.on()` handler.
 *
 * @param {object} data `Buffer` instance
 * @api private
 */
Process.prototype.onStdout = function(data) {
  data = data.toString().trim();

  if (/Looks like you didn't run any test/.test(data)) {
    this.verbose('No matching tests: %s', this.get('label'));
    this.noTestsRan = true;
    return;
  }

  if (!this.statusList.push(data)) { // Store/parse status lines. Output remaining.
    this.data.push({data: data});
  }
};

/**
 * Dump all trace messages to stderr.
 */
Process.prototype.showTrace = function() {
  var self = this;
  var traceSteps = this.statusList.select({type: 'trace'}).array();
  if (traceSteps.length) {
    this.stderr('conjure trace:');
    traceSteps.reverse().forEach(function conjureOnEachTraceStep(step) {
      self.stderr('    ' + step.toString());
    });
  }
};
