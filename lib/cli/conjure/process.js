module.exports = {
  Process: Process,
  create: create
};

var spawn = require('child_process').spawn;
var events = require('events');
var util = require('util');

var requireComponent = require('../../component').require;
var bind = requireComponent('bind');
var configurable = requireComponent('configurable.js');
var each = requireComponent('each');
var processData = require('./process-data');
var statusList = require('./status-list');

function create() {
  return new Process();
}

function Process() {
  this.settings = {
    cliMod: null,
    cliOptions: null,
    spawnArgs: null,
    label: null,
    testDir: null
  };
  this.data = processData.create(); // Data bound for console
  this.handle = null; // ChildProcess
  this.noTestsRan = false; // All tests skipped due to grep/grepv
  this.statusList = statusList.create(); // Internal status events, hidden from console

  events.EventEmitter.call(this);
}

util.inherits(Process, events.EventEmitter);
configurable(Process.prototype);

Process.prototype.spawn = function() {
  var label = this.get('label');
  var cliMod = this.get('cliMod');
  var options = this.get('cliOptions');
  var spawnArgs = this.get('spawnArgs');

  this.stdout = cliMod.createConsole(label, console.log);
  this.stderr = cliMod.createConsole(label, console.error, cliMod.clc.red);
  this.verbose = cliMod.createVerbose(label);
  this.data.set('label', label);

  this.verbose('spawn: casperjs %s', spawnArgs.join(' '));

  this.handle = spawn('casperjs', spawnArgs);
  this.handle.on('exit', bind(this, this.onExit));
  this.handle.stderr.on('data', bind(this, this.onStderr));
  this.handle.stdout.on('data', bind(this, this.onStdout));

  if (options.timeout) {
    setTimeout(bind(this, this.onTimeout), options.timeout);
  }
};

Process.prototype.onTimeout = function() {
  this.emit('timeout');
  this.handle.kill();
  this.stdout('Auto-killed after %dms timeout', this.get('cliOptions'));

  var waitStatus = this.statusList.select({type: 'wait'}).last();
  if (waitStatus) {
    this.stdout('Potential timeout reason: %s', JSON.stringify(waitStatus));
  }
};

Process.prototype.onExit = function(code) {
  var self = this;
  var label = this.get('label');
  var options = this.get('cliOptions');

  // Skip output when --grep[v]-case excluded a file's entire suite.
  if (!this.noTestsRan || (!options.grepCase && !options.grepvCase)) {
    this.data.each(function(log) {
      if (log.err) {
        self.stderr(log.data);
      } else {
        self.stdout(log.data);
      }
    });
  }
  this.verbose('exited with code %d', code);
  this.emit('exit', code);
};

Process.prototype.onStderr = function(data) {
  this.data.push({err: true, data: data.toString()});
};

Process.prototype.onStdout = function(data) {
  data = data.toString().trim();

  if (/Looks like you didn't run any test/.test(data)) {
    this.verbose('No matching tests: %s', this.get('label'));
    this.noTestsRan = true;
  }

  if (!this.statusList.push(data)) { // Store/parse status lines. Output remaining.
    this.data.push({data: data.toString()});
  }
};
