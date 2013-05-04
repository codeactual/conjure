/**
 * Reference to Status.
 */
module.exports = Status;

var util = require('util');
var sprintf = util.format;

var requireComponent = require('../../..').requireComponent;
var configurable = requireComponent('configurable.js');

/**
 * Status constructor.
 *
 * Describes an internal message, sent via stdout, that is collected by `conjure`
 * and displayed later if relavant (e.g. after a timeout or error).
 *
 * Configuration:
 *
 * - `{object} impulseBin` `ImpulseBin` instance
 *
 * Properties:
 *
 * - `{string} source` Ex. 'it'
 * - `{string} type`
 *   - `trace` Test script reached a step that might be useful in a stack trace.
 * - `{object} meta` Ex. current test helper method `name` and `args`
 * - `{number} times` Consecutive occurences
 *
 * @param {string} json
 * @see ImpulseBin https://github.com/codeactual/impulse-bin/blob/master/docs/ImpulseBin.md
 */
function Status(json) {
  this.settings = {
    impulseBin: null
  };

  json = JSON.parse(json);
  this.source = json.source;
  this.type = json.type;
  this.meta = json.meta;
  this.times = 1;
}

configurable(Status.prototype);

/**
 * Stringify instance, ex. for debugging.
 *
 * @api private
 */
Status.prototype.toString = function(includeType) {
  var self = this;
  var clc = this.get('impulseBin').clc;
  var type = includeType ? ' ' + this.type : '';
  var times = this.times > 1 ? clc.green(' x ' + this.times) : '';
  var meta = [];
  Object.keys(this.meta).forEach(function(key) {
    meta.push(sprintf('%s: %s', clc.cyan(key), clc.magenta(self.meta[key])));
  });
  meta = meta.length ? meta.join(', ') : meta;
  return sprintf('%s%s (%s)%s', clc.yellow(this.source), type, meta, times);
};
