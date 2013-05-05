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
  this.depth = json.depth;
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

  // Consecutive repeat counts
  var times = this.times > 1 ? clc.green(' x ' + this.times) : '';

  var meta = []; // Colorize key/value pairs
  Object.keys(this.meta).forEach(function(key) {
    meta.push(sprintf('%s: %s', clc.cyan(key), clc.magenta(self.meta[key])));
  });
  meta = meta.length ? meta.join(', ') : meta;

  // Add stack trace lanes to visualize depth
  var traceIndent = '    ';
  var laneCx = traceIndent.length;
  indent = (new Array(this.depth + 1)).join(traceIndent);
  indent = indent.replace(new RegExp('.{1,' + laneCx + '}', 'g'), '|$&');

  return sprintf(
    '%s%s%s (%s)%s',
    indent, clc.yellow(this.source), type, meta, times
  );
};
