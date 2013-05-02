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

var requireComponent = require('../../..').requireComponent;
var Status = require('./status');
var enumerable = requireComponent('enumerable');

/**
 * StatusList constructor.
 *
 * Properties:
 *
 * - `{array} list` Status objects
 *
 * @see [Status](Status.md)
 */
function StatusList() {
  this.list = [];
}

enumerable(StatusList.prototype);

// To extract internal status messages from `casperjs` stdout.
StatusList.statusRe = /^conjure:([^:]+):(.*)$/;

/**
 * Parse a `casperjs` stdout string, store detected internal status messages.
 *
 * @param {string} str May contain a status event.
 * @return {object} `Status` object if found. Otherwise null.
 * @see [Status](Status.md)
 */
StatusList.prototype.push = function(str) {
  var matches = str.match(StatusList.statusRe);
  if (matches) {
    var status = new Status(matches[1], matches[2]);
    this.list.push(status);
    return status;
  }
  return null;
};

/**
 * Tterator for `enumerable` component mixin.
 *
 * @api private
 * @see enumerable https://github.com/component/enumerable
 */
StatusList.prototype.__iterate__ = function() {
  var self = this;
  return {
    length: function() { return self.list.length; },
    get: function(i) { return self.list[i]; }
  };
};

/**
 * Stringify instance, ex. for debugging.
 *
 * @api private
 */
StatusList.prototype.toString = function() {
  return JSON.stringify(this.toJSON());
};
