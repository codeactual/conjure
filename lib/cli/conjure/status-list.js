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
StatusList.statusRe = /^conjure_status:(.*)$/;

/**
 * Parse a `casperjs` stdout string, store detected internal status messages.
 *
 * @param {string} str May contain a status event.
 * @return {object} `Status` object if found. Otherwise null.
 * @see [Status](Status.md)
 */
StatusList.prototype.push = function(str) {
  var matches = str.match(StatusList.statusRe);
  var status = null;

  if (!matches) { return; }

  if (this.list.length && str === this.lastMsg) { // Collapse an immediate repeat
    status = this.at(this.list.length - 1);
    status.times++;
  } else {
    status = new Status(matches[1]);
    status.set('impulseBin', this.get('impulseBin'));
    this.list.push(status);
  }

  this.lastMsg = str;
  return status;
};

/**
 * Stringify instance, ex. for debugging.
 *
 * @api private
 */
StatusList.prototype.toString = function() {
  return JSON.stringify(this.toJSON());
};
