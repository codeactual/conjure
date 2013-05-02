/**
 * Reference to ProcessData.
 */
exports.ProcessData = ProcessData;

/**
 * Create a new ProcessData.
 *
 * @return {object}
 */
exports.create = function() { return new ProcessData(); };

var requireComponent = require('../../..').requireComponent;
var configurable = requireComponent('configurable.js');
var enumerable = requireComponent('enumerable');

/**
 * ProcessData constructor.
 *
 * Configuration:
 *
 * - `{string} label` Ex. name of the test file, used for logging
 *
 * Properties:
 *
 * - `{array} list` Objects describing stdout/stderr
 *
 * @see ProcessData.prototype.push for property list
 */
function ProcessData() {
  this.settings = {
    label: null
  };
  this.list = [];
}

/**
 * Add a stdout/stderr message.
 *
 * @param {object} data
 * - `{boolean} err` True if stderr
 * - `{string} data`
 */
ProcessData.prototype.push = function(data) {
  this.list.push(data);
};

configurable(ProcessData.prototype);
enumerable(ProcessData.prototype);

/**
 * Tterator for `enumerable` component mixin.
 *
 * @api private
 */
ProcessData.prototype.__iterate__ = function() {
  var self = this;
  return {
    length: function() { return self.list.length; },
    get: function(i) { return self.list[i]; }
  };
};
