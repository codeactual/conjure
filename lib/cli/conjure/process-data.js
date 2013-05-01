module.exports = {
  ProcessData: ProcessData,
  create: create
};

var requireComponent = require('../../..').requireComponent;
var configurable = requireComponent('configurable.js');
var enumerable = requireComponent('enumerable');

function create() {
  return new ProcessData();
}

function ProcessData() {
  this.settings = {
    label: null
  };
  this.list = [];
}

ProcessData.prototype.push = function(data) {
  this.list.push(data);
};

configurable(ProcessData.prototype);
enumerable(ProcessData.prototype);

/**
 * Tterator for enumerable component mixin.
 */
ProcessData.prototype.__iterate__ = function() {
  var self = this;
  return {
    length: function() { return self.list.length; },
    get: function(i) { return self.list[i]; }
  };
};
