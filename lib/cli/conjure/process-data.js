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
var enumerableProp = requireComponent('enumerable-prop');

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
 *   - Added by `enumerable-prop`
 *
 * @see ProcessData.prototype.push for property list
 * @see enumerable-prop https://github.com/codeactual/enumerable-prop
 */
function ProcessData() {
  this.settings = {
    label: null
  };
  enumerableProp(this);
}

configurable(ProcessData.prototype);
