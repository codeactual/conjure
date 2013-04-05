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

var bddflow = require('bdd-flow');
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

  this.flow = bddflow.create();
}

configurable(Parapsych.prototype);

/**
 * Perform last-minute init based on collected configuration.
 * Silently add an initial describe() to verify initial URL/selector.
 */
Parapsych.prototype.start = function(name, cb) {
  var self = this;
  var cli = this.get('cli');

  if (cli.options.grep) { // Convert `--grep foo bar baz` to /foo bar baz/
    this.flow.set('grep', new RegExp(cli.args.join(' ')));
  }

  this.casper = this.require('casper').create(this.get('casperConfig'));
  this.flow.addContextProp('casper', this.casper);
  Object.keys(thenContext).forEach(function(key) {
    self.flow.addContextProp(key, bind(self, self[key]));
  });

  this.flow.set('itWrap', function(name, cb) {
    self.casper.then(function() {
      cb.call(this);
    });
  });

  this.casper.start(this.url(this.get('initUrl')));

  var descName = 'initial URL/selector';

  this.flow.addRootDescribe(descName, function() {
    this.it('should be loaded/found', function() {
      this.casper.then(function() {
        self.casper.waitForSelector(self.get('initSel'));
      });
    });
  });

  this.flow.addRootDescribe(name, cb);
  this.run();
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

/**
 * Run collected BBD layers.
 */
Parapsych.prototype.run = function() {
  var self = this;

  var initSel = this.get('initSel');
  var initUrl = this.get('initUrl');

  var initMsg = 'Opening [' + initUrl + ']';
  if (initSel) {
    initMsg += ' Waiting For Selector [' + initSel + ']';
  }
  this.casper.test.info(initMsg);

  this.casper.then(function() {
    self.flow.run();
  });

  this.casper.run(function() {
    this.test.renderResults(true);
  });
};

/**
 * Methods mixed in to each it()/andThen() context.
 */
var thenContext = {};

/**
 * Wait for matching element to exist, then click it.
 *
 * @param {string} sel
 */
thenContext.andClick = function(sel) {
  this.selectorExists(sel);
  this.casper.thenEvaluate(function(sel) {
    $(sel).click();
  }, sel);
};

/**
 * then() wrapper that injections the same context as the outer it().
 *
 * @param {function} cb
 */
thenContext.andThen = function(cb) {
  var self = this;
  this.casper.then(function() {
    var targetContext = this;
    var keys = Object.keys(self).concat(Object.keys(thenContext));
    each(keys, function(key) {
      if (typeof self[key] === 'undefined') {
        if (is.Function(self[key])) {
          targetContext[key] = bind(self, self[key]);
        } else {
          targetContext[key] = self[key];
        }
      }
    });
    cb.call(targetContext);
  });
};

/**
 * assertTextExists() alternative that uses jQuery selectors.
 *
 * @param {string} sel
 * @param {string|regexp} text
 */
thenContext.assertSelText = function(sel, text) {
  this.casper.then(function() {
    this.test['assert' + (is.string(text) ? 'Equals' : 'Match')](
      this.evaluate(function(sel) {
        return $(sel).text();
      }, sel),
      text
    );
  });
};

/**
 * casper.each() alternative that injects the same context as the outer it().
 *
 * @param {array} list
 * @param {function} cb Receives (val).
 */
thenContext.forEach = function(list, cb) {
  var self = this;
  this.casper.each(list, function(__self, item) {
    cb.apply(self, [].slice.call(arguments, 1));
  });
};

/**
 * Append a fragment ID to the current URL.
 *
 * @param {string} hash Without leading '#'.
 * @param {string} [sel] Optional selector to wait for after navigation.
 */
thenContext.openHash = function(hash, sel) {
  this.casper.thenEvaluate(function _openHash(hash) {
    window.location.hash = '#' + hash;
  }, hash);
  if (sel) {
    this.selectorExists(sel);
  }
};

/**
 * Re-open the initial URL.
 */
thenContext.openInitUrl = function() {
  this.casper.thenOpen(this.url(this.get('initUrl')));
};

/**
 * require() any file relative to --rootdir.
 *
 * @param {string} name Prefix with leading './'.
 *  If rootdir is /path/to/proj, './foo' will require /path/to/proj/foo.js.
 * @return {mixed} Loaded module.
 */
thenContext.require = function(name) {
  var require = this.get('casperRequire');
  var relPathRe = /^\.\//;
  if (relPathRe.test(name)) {
    return require(this.get('cli').options.rootdir + '/' + name.replace(relPathRe, ''));
  }
  return require(name); // Ex. 'casper' itself
};

/**
 * Alternative to waitForSelector() to use jQuery selector support,
 * ex. ':first' syntax.
 *
 * @param {string} sel
 * @param {boolean} [negate] Use true if selector is not expected to match.
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

/**
 * Negated selectorExists().
 *
 * @param {string} sel
 */
thenContext.selectorMissing = function(sel) {
  this.selectorExists(sel, true);
};

/**
 * sendKeys() wrapper that first waits for a selector to exist.
 *
 * @param {string} sel
 * @param {string} keys
 */
thenContext.thenSendKeys = function(sel, keys) {
  this.selectorExists(sel);
  this.andThen(function() {
    this.sendKeys(sel, keys);
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
