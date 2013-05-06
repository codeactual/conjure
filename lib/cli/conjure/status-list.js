/**
 * Reference to StatusList.
 */
exports.StatusList = StatusList;

/**
 * Create a new StatusList.
 *
 * @return {object}
 */
exports.create = function() { return new StatusList(); };

var Status = require('./status');

var requireComponent = require('../../..').requireComponent;
var configurable = requireComponent('configurable.js');
var enumerableProp = requireComponent('enumerable-prop');

/**
 * StatusList constructor.
 *
 * Configuration:
 *
 * - `{object} impulseBin` `ImpulseBin` instance
 * - `{string} rotationSource` Ex. 'describe' or 'it'
 *   - Each time a status message comes from this source, reset the list.
 *   - Ex. to keep a list limited to the most recent `it()`
 *
 * Properties:
 *
 * - `{array} list` Status objects
 *   - Added by `enumerable-prop`
 * - `{string} lastMsg` Used to collapse/count repeats
 *
 * @see [Status](Status.md)
 * @see enumerable-prop https://github.com/codeactual/enumerable-prop
 * @see ImpulseBin https://github.com/codeactual/impulse-bin/blob/master/docs/ImpulseBin.md
 */
function StatusList() {
  this.settings = {
    impulseBin: null
  };
  this.lastMsg = '';
  enumerableProp(this);
}

configurable(StatusList.prototype);

// To extract internal status messages from `casperjs` stdout.
StatusList.statusRe = /(?:conjure_status:)({[^\n]*})/;

/**
 * Parse a `casperjs` stdout string, store detected internal status messages.
 *
 * @param {string} str May contain a status event.
 * @return {boolean} True if item pushed.
 * @see [Status](Status.md)
 */
StatusList.prototype.pushIfStatusFound = function(str) {
  var self = this;
  var rotationSource = this.get('rotationSource');
  var status;
  var found = false;

  // ChildProcess `stdout` handler may emit multiple lines at a time.
  var lines = str.trim().split('\n');

  lines.forEach(function(line) {
    var matches = line.match(StatusList.statusRe);
    if (!matches) { return; }

    found = true;

    if (self.list.length && matches[1] === self.lastMsg) { // Collapse an immediate repeat
      status = self.at(self.list.length - 1);
      status.times++;
    } else {
      var parsed = JSON.parse(matches[1]);
      if (rotationSource && rotationSource === parsed.source) {
        self.list = [];
      }
      status = new Status(parsed);
      status.set('impulseBin', self.get('impulseBin'));
      self.push(status);
    }
    self.lastMsg = matches[1];
  });

  return found;
};

/**
 * Stringify instance, ex. for debugging.
 *
 * @api private
 */
StatusList.prototype.toString = function() {
  return JSON.stringify(this.toJSON());
};
