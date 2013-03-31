/**
 * 
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
'use strict';

module.exports = {
  Parapsych: Parapsych,
  require: require // Allow tests to use component-land require.
};

var configurable = require('configurable.js');
var sprintf;
var shelljs;
var defShellOpt = {silent: true};

/**
 *
 */
function Parapsych() {
  this.settings = {
  };
}

configurable(Parapsych.prototype);

/**
 * Apply collected configuration.
 */
Parapsych.prototype.init = function() {
  var nativeRequire = this.get('nativeRequire');
  shelljs = nativeRequire('shelljs');
  sprintf = nativeRequire('util').format;
};
