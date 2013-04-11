module.exports = StatusList;

var requireComponent = require('../../component').require;
var Status = require('./status');
var enumerable = requireComponent('enumerable');

function StatusList() {
  this.list = [];
}

enumerable(StatusList.prototype);

StatusList.statusRe = /^conjure:([^:]+):(.*)$/;

/**
 * Parse the string, detect a status line , store it if found.
 *
 * @param {string} str May contain a status event.
 * @return {object} Status object if found. Otherwise null.
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
 * Tterator for enumerable component mixin.
 */
StatusList.prototype.__iterate__ = function() {
  var self = this;
  return {
    length: function() { return self.list.length; },
    get: function(i) { return self.list[i]; }
  };
};
