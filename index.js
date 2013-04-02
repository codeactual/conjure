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
    started: false,             // 1st describe() processed
    initSel: 'body',            // 1st selector to wait for
    casperRequire: require,     // CasperJS-env require()
    rootDir: '',                // from `parapsych` --rootdir
    serverProto: 'http',        // for url()
    serverHost: 'localhost',    // for url()
    serverPort: '8174',         // for url()
    grep: /.?/,                 // from `parapsych` --grep
    cli: {},                    // Native CasperJS CLI interface
    casperConfig: {             // Directly passed to CasperJS create()
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
  this.depth = []; // Ex. ['component', 'sub-component', 'should do X']

  // For test script convenience.
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

  // Convert `bin/parapsych --grep foo bar baz` to /foo bar baz/
  if (cli.options.grep) {
    this.set('grep', new RegExp(cli.args.join(' ')));
  }
  if (cli.options.rootdir) {
    this.set('rootDir', cli.options.rootdir);
  }

  this.casper = this.require('casper').create(this.get('casperConfig'));
  window.casper = this.casper;

  var initSel = this.get('initSel');
  var initUrl = this.get('initUrl');

  this.casper.test.info('INIT URL: ' + initUrl);
  if (initSel) {
    this.casper.test.info('INIT SELECTOR: ' + initSel);
  }

  this.casper.test.info('  ' + desc);
  this.depth.push(desc);

  this.casper.start(this.url(initUrl));
  this.casper.then(function(response) {
    self.response = response;
    self.casper.waitForSelector(initSel);
  });
  this.casper.then(cb);

  this.set('started', true);
};

Parapsych.prototype.describe = function(desc, cb) {
  var self = this;

  if (this.get('started')) {
    this.casper.then(function() {
      self.casper.test.info('  ' + desc);
      self.depth.push(desc);
      cb.call(self);
    });
    this.casper.then(function() { self.depth.pop(); });
  } else {
    this.start(desc, cb);
  }
};

Parapsych.prototype.it = function(desc, cb, wrap) {
  var self = this;
  var depth = this.depth.concat(desc);
  if (!this.get('grep').test(depth.join(' '))) {
    return;
  }
  this.casper.then(function() {
    self.casper.test.info('    ' + desc);
    self.depth = depth;
  });
  if (wrap || typeof wrap === 'undefined') {
    this.andThen(cb);
  } else {
    cb.call(this);
  }
  this.casper.then(function() { self.depth.pop(); });
};

Parapsych.prototype.url = function(relUrl) {
  return this.get('serverProto') +
    '://' + this.get('serverHost') +
    ':' + this.get('serverPort') +
    relUrl;
};

Parapsych.prototype.openInitUrl = function() {
  this.casper.thenOpen(this.url(this.get('initUrl')));
};

Parapsych.prototype.done = function() {
  this.casper.run(function() {
    this.test.renderResults(true);
  });
};

var baseMixin = {};

baseMixin.require = function(name) {
  var require = this.get('casperRequire');
  var relPathRe = /^\.\//;
  if (relPathRe.test(name)) {
    return require(this.get('rootDir') + '/' + name.replace(relPathRe, ''));
  }
  return require(name);
};

/**
* Alternative to waitForSelector() to use jQuery selector support,
* ex. ':first' syntax.
*/
baseMixin.selectorExists = function(sel, negate) {
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

baseMixin.selectorMissing = function(sel) {
  this.selectorExists(sel, true);
};

baseMixin.andClick = function(sel) {
  this.selectorExists(sel);
  this.casper.thenEvaluate(function(sel) {
    $(sel).click();
  }, sel);
};

baseMixin.forEach = function(list, cb) {
  var self = this;
  this.casper.each(list, function(__self, item) {
    cb.apply(self, [].slice.call(arguments, 1));
  });
};

baseMixin.openHash = function(hash, sel) {
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
baseMixin.andThen = function(cb) {
  var self = this;
  this.casper.then(function() {
    // In addition to this.test.*, augment with each(), etc.
    var then = this;
    var keys = Object.keys(self).concat(Object.keys(baseMixin));
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

baseMixin.thenSendKeys = function(sel, content) {
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
baseMixin.assertSelText = function(sel, text, message) {
  this.casper.then(function() {
    this.test['assert' + (is.string(text) ? 'Equals' : 'Match')](
      this.evaluate(function(sel) {
        return $(sel).text();
      }, sel),
      text
    );
  });
};

mixin(baseMixin);

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
