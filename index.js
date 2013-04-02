/**
 * CasperJS parallel running, BDD flow, API wrappers
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
/*global window:false, $:false*/
'use strict';

module.exports = {
  Parapsych: Parapsych,
  create: create,
  mixin: mixin,
  require: require // Allow tests to use component-land require.
};

var bind = require('bind');
var configurable = require('configurable.js');
var each = require('each');
var is = require('is');

/**
 * Allow test scripts to easily create common-case Parapsych instances.
 *
 * @param {function} require CasperJS-env require()
 */
function create(require) {
  return new Parapsych(require);
}

/**
 * Add BDD globals and init configuration.
 *
 * @param {function} require CasperJS-env require()
 */
function Parapsych(require) {
  this.settings = {
    started: false, // 1st describe() processed
    initSel: 'body', // 1st selector to wait for
    casperRequire: require, // CasperJS-env require()
    baseUrl: 'http://localhost:8174', // for url()
    grep: /.?/, // from `parapsych` --grep
    cli: {}, // Native CasperJS CLI interface
    casperConfig: { // Directly passed to CasperJS create()
      exitOnError: true,
      logLevel: 'debug',
      pageSettings: {
        loadImages: false,
        loadPlugins: false,
        XSSAuditingEnabled: true,
        verbose: true,
        onError: function(self, m) {
          console.error('FATAL error:' + m);
          self.exit();
        },
        onLoadError: function(self, m) {
          console.error('FATAL load error:' + m);
          self.exit();
        }
      }
    }
  };

  // Store it() descriptions for --grep, one item per BDD nested layer.
  this.bddLayer = []; // Ex. ['component', 'sub-component', 'should do X']

  // Test script convenience.
  window.describe = bind(this, this.describe);
  window.it = bind(this, this.it);
}

configurable(Parapsych.prototype);

/**
 * Last-minute init triggered by 1st describe().
 *
 * @param {string} desc From 1st describe().
 * @param {function} cb From 1st describe().
 */
Parapsych.prototype.start = function(desc, cb) {
  var self = this;
  var cli = this.get('cli');

  if (cli.options.grep) { // Convert `--grep foo bar baz` to /foo bar baz/
    this.set('grep', new RegExp(cli.args.join(' ')));
  }

  this.set('url', cli.options.url);

  this.casper = this.require('casper').create(this.get('casperConfig'));
  window.casper = this.casper; // Test script convenience.

  var initSel = this.get('initSel');
  var initUrl = this.get('initUrl');

  var initMsg = 'Opening [' + initUrl + ']';
  if (initSel) {
    initMsg += ' Waiting For Selector [' + initSel + ']';
  }
  this.casper.test.info(initMsg);

  this.casper.test.info('  ' + desc);
  this.bddLayer.push(desc);

  // Fail the 1st describe() if initial URL or selector is not found.
  this.casper.start(this.url(initUrl));
  this.casper.then(function() {
    self.casper.waitForSelector(initSel);
  });
  this.casper.then(cb);

  this.set('started', true);
};

/**
 * Add a BDD describe() subject.
 *
 * @param {string} desc
 * @param {function} cb
 */
Parapsych.prototype.describe = function(desc, cb) {
  var self = this;
  if (this.get('started')) {
    this.casper.then(function() {
      self.casper.test.info('  ' + desc);
      self.bddLayer.push(desc);
      cb.call(self);
    });
  } else {
    this.start(desc, cb);
  }
  this.casper.then(function() { self.bddLayer.pop(); });
};

/**
 * Add a BDD it() expectation. Enforce --grep.
 *
 * @param {string} desc
 * @param {function} cb
 * @param
 */
Parapsych.prototype.it = function(desc, cb) {
  var self = this;
  var bddLayer = this.bddLayer.concat(desc);

  if (!this.get('grep').test(bddLayer.join(' '))) {
    return;
  }

  this.casper.then(function() {
    self.casper.test.info('    ' + desc);
    self.bddLayer = bddLayer; // Save for pop() below.
  });
  this.andThen(cb);
  this.casper.then(function() { self.bddLayer.pop(); });
};

/**
 * Convert a relative URL into a full.
 *
 * @param {string} relUrl Includes leading slash.
 * @return {string}
 */
Parapsych.prototype.url = function(relUrl) {
  return this.get('baseUrl') + relUrl;
};

Parapsych.prototype.done = function() {
  this.casper.run(function() {
    this.test.renderResults(true);
  });
};

var thenContext = {};

thenContext.openInitUrl = function() {
  this.casper.thenOpen(this.url(this.get('initUrl')));
};

thenContext.require = function(name) {
  var require = this.get('casperRequire');
  var relPathRe = /^\.\//;
  if (relPathRe.test(name)) { // Ex. name='./foo', require /path/to/proj/foo.js
    return require(this.get('cli').options.rootdir + '/' + name.replace(relPathRe, ''));
  }
  return require(name); // Ex. 'casper' itself
};

/**
* Alternative to waitForSelector() to use jQuery selector support,
* ex. ':first' syntax.
*/
thenContext.selectorExists = function(sel, negate) {
  var self = this;
  this.casper.waitFor(function selectorExistsWaitFor() {
    return this.evaluate(function selectorExistsEvaluate(sel, count) {
      return count === $(sel).length;
    }, sel, negate ? 0 : 1);
  });
  this.casper.then(function selectorExistsThen() {
    this.test.assertTrue(true, (negate ? 'missing' : 'exists') + ': ' + sel);
  });
};

thenContext.selectorMissing = function(sel) {
  this.selectorExists(sel, true);
};

thenContext.andClick = function(sel) {
  this.selectorExists(sel);
  this.casper.thenEvaluate(function(sel) {
    $(sel).click();
  }, sel);
};

thenContext.forEach = function(list, cb) {
  var self = this;
  this.casper.each(list, function(__self, item) {
    cb.apply(self, [].slice.call(arguments, 1));
  });
};

thenContext.openHash = function(hash, sel) {
  this.casper.thenEvaluate(function _openHash(hash) {
    window.location.hash = '#' + hash;
  }, hash);

  if (sel) {
    this.selectorExists(sel);
  }
};

/**
* then() wrapper with 'this' extended w/ Parapsych properties.
*
* @param {function} cb
*/
thenContext.andThen = function(cb) {
  var self = this;
  this.casper.then(function() {
    // In addition to this.test.*, augment with each(), etc.
    var then = this;
    var keys = Object.keys(self).concat(Object.keys(thenContext));
    each(keys, function(key) {
      if (typeof self[key] === 'undefined') {
        if (is.Function(self[key])) {
          then[key] = bind(self, self[key]);
        } else {
          then[key] = self[key];
        }
      }
    });
    cb.call(then);
  });
};

thenContext.thenSendKeys = function(sel, content) {
  this.selectorExists(sel);
  this.andThen(function() {
    this.sendKeys(sel, content);
  });
};

/**
* assertTextExists() alternative that uses jQuery selectors.
*
* @param {string} sel
* @param {string|regexp} text
*/
thenContext.assertSelText = function(sel, text, message) {
  this.casper.then(function() {
    this.test['assert' + (is.string(text) ? 'Equals' : 'Match')](
      this.evaluate(function(sel) {
        return $(sel).text();
      }, sel),
      text
    );
  });
};

mixin(thenContext);

/**
 * Mix the given function set into Parapsych's prototype.
 *
 * @param {object} ext
 */
function mixin(ext) {
  Object.keys(ext).forEach(function(key) {
    if (typeof ext[key] === 'function') {
      Parapsych.prototype[key] = ext[key];
    }
  });
}
