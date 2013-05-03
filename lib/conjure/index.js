/**
 * Parallel CasperJS runner, BDD flow, module-based tests, API helpers
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
/*global window:false, $:false, require:true*/
'use strict';

/**
 * Reference to Conjure.
 */
exports.Conjure = Conjure;

/**
 * Create a new Conjure.
 *
 * @param {object} requireCasper Casper-land `require()`
 * @return {object}
 */
exports.create = function(requireCasper) { return new Conjure(requireCasper); };

/**
 * Extend Conjure.prototype.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extendConjure = function(ext) { return require('extend')(Conjure.prototype, ext); };

/**
 * Extend the object that includes functions like helper.selectorExists.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extendHelpers = function(ext) { return require('extend')(helpers, ext); };

/**
 * Let tests load component-land modules.
 *
 * @type {function}
 * @api private
 */
exports.requireComponent = require;

/**
 * Let tests stub the component-land `require()`.
 *
 * @type {function}
 * @api private
 */
exports.setRequire = function(stub) { require = stub; };

var requireComponent = require;
var bddflow = require('bdd-flow');
var configurable = require('configurable.js');

/**
 * Add BDD globals and init configuration.
 *
 * Usage:
 *
 *     var conjure = require('conjure').create();
 *     conjure.set('exitOnError', false);
 *
 * Configuration:
 *
 * - `{string} baseUrl` Of target test server. `[http://localhost:8174]`
 * - `{string} initPath` Wait for this relative path to load before starting tests. `[/]`
 * - `{string} initSel` Wait for this selector (on `initPath`) before starting tests. `[body]`
 * - `{object} casperConfig` Native CasperJS `create()` settings.
 *
 * Default `casperConfig`:
 *
 *     {
 *       exitOnError: true,
 *       logLevel: 'debug',
 *       pageSettings: {
 *         loadImages: false,
 *         loadPlugins: false,
 *         XSSAuditingEnabled: true,
 *         verbose: true,
 *         onError: function(self, m) { self.die('CasperJS onError: ' + m, 1); },
 *         onLoadError: function(self, m) { self.die('CasperJS onLoadError: ' + m, 1); }
 *       }
 *     }
 *
 * To modify `casperConfig`:
 *
 * - `get() + set()` from a test script.
 * - Or apply globally using a `--bootstrap` module.
 *
 * Properties:
 *
 * - `{object} conjure` All `helpers` functions bound to `this`.
 * - `{object} flow` `Bddflow` instance
 * - `{object} utils` Native CasperJS `utils` module
 * - `{object} colorizer` Native CasperJS `colorizer` module
 * - `{boolean} running` True after Conjure.prototype.run executes
 *
 * @param {function} requireCasper CasperJS-env require()
 * @see Bddflow https://github.com/codeactual/bdd-flow/blob/master/docs/Bddflow.md
 */
function Conjure(requireCasper) {
  var self = this;
  var bind = requireComponent('bind');

  this.settings = {
    // Advertised.
    baseUrl: 'http://localhost:8174',
    initPath: '/',
    initSel: 'body',
    casperConfig: {
      exitOnError: true,
      logLevel: 'debug',
      pageSettings: {
        loadImages: false,
        loadPlugins: false,
        XSSAuditingEnabled: true,
        verbose: true,
        onError: function(self, m) { self.die('CasperJS onError: ' + m, 1); },
        onLoadError: function(self, m) { self.die('CasperJS onLoadError: ' + m, 1); }
      }
    },

    // Internal.
    cli: {}, // Native CasperJS CLI interface
    requireCasper: requireCasper // CasperJS-env require()
  };

  // TODO: is this needed?
  requireComponent('extend')(this, helpers);

  // Bound helpers. Added as properties so they can refer to others.
  this.conjure = {};
  Object.keys(helpers).forEach(function(key) {
    self.conjure[key] = bind(self, self[key]);
  });

  this.flow = bddflow.create();
  this.utils = this.require('utils');
  this.colorizer = this.require('colorizer').create('Colorizer');
  this.running = false;
}

configurable(Conjure.prototype);

/**
 * Build a context object that includes:
 *
 * - All enumerable keys from the parent.
 * - Where functions are bound to the parent.
 *
 * @param {object} parent
 * @param {string|array} pluck Key(s) from parent to pluck.
 * @param {string|array} omit Key(s) from parent to omit.
 * @return {object}
 */
Conjure.createContext = function(parent, pluck, omit) {
  var bind = require('bind');
  var each = require('each');
  var is = require('is');

  pluck = [].concat(pluck || []);
  omit = [].concat(omit || []);
  var context = {};
  var keys = pluck.length ? pluck : Object.keys(parent);
  each(keys, function(key) {
    if (-1 !== omit.indexOf(key)) { return; }
    if (is.Function(parent[key])) {
      context[key] = bind(parent, parent[key]);
    } else {
      context[key] = parent[key];
    }
  });
  return context;
};

/**
 * Check if (internal) run() has been called.
 *
 * @return {boolean}
 */
Conjure.prototype.isRunning = function() {
  return this.running;
};

/**
 * Run the suite/root `describe()`.
 *
 * Perform last-minute init based on collected configuration.
 * Silently add an initial describe() to verify initial URL/selector.
 *
 * @param {string} name Suite/root-`describe()` name
 * @param {function} cb
 */
Conjure.prototype.test = function(name, cb) {
  var self = this;

  var cli = this.get('cli');
  if (cli.options.grep) { // Convert `--grep[v] foo bar baz` to /foo bar baz/
    this.flow.set('grep', new RegExp(cli.args.join(' ')));
  } else if (cli.options.grepv) {
    this.flow.set('grepv', new RegExp(cli.args.join(' ')));
  }

  this.casper = this.require('casper').create(this.get('casperConfig'));
  this.flow.addContextProp('casper', this.casper);
  this.flow.addContextProp('colorizer', this.colorizer);
  this.flow.addContextProp('utils', this.utils);

  this.flow.set('itWrap', function(name, cb) {
    self.casper.then(function() {
      cb.call(this);
    });
  });
  this.flow.set('describeWrap', function(name, cb) {
    var contextKeys = ['casper', 'utils', 'colorizer', 'conjure'];
    cb.call(Conjure.createContext(self, contextKeys));
  });

  this.casper.start(this.url(this.get('initPath')));

  var descName = 'initial URL/selector';

  this.flow.addRootDescribe(descName, function() {
    this.it('should be loaded/found', function() {
      this.conjure.selectorExists(self.get('initSel'));
    });
  });

  this.flow.addRootDescribe(name, cb);
  this.run();
};

/**
 * Run collected BBD layers.
 */
Conjure.prototype.run = function() {
  var self = this;

  this.running = true;

  var initSel = this.get('initSel');
  var initPath = this.get('initPath');

  var initMsg = 'Opening [' + initPath + ']';
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
 * Send internal message to `conjure`.
 *
 * @param {string} source Ex. method name.
 * @param {string} type
 * - `wait` Details describe a potential timeout cause.
 * @param {object} detail Key/value pairs
 * @api private
 */
Conjure.prototype.status = function(source, type, detail) {
  detail = detail || {};
  detail.statusSource = source;
  console.log(this.utils.format(
    'conjure:%s:%s', type, JSON.stringify(detail)
  ));
};

/**
 * Methods mixed in to each it()/then() context.
 */
var helpers = {};

/**
 * click() alternative that uses jQuery selectors and first waits for a match.
 *
 * @param {string} sel
 */
helpers.click = function(sel) {
  this.conjure.selectorExists(sel);
  this.casper.thenEvaluate(function(sel) {
    $(sel).click();
  }, sel);
};

/**
 * then() alternative that with access to the same API as it().
 *
 * @param {function} cb
 */
helpers.then = function(cb) {
  var self = this;
  var extend = require('extend');
  var contextKeys = ['utils', 'colorizer', 'conjure'];
  var context = Conjure.createContext(this, contextKeys);
  this.casper.then(function() {
    cb.call(extend(context, {casper: self.casper, test: this.test}));
  });
};

/**
 * assertTextExists() alternative that uses jQuery selectors.
 *
 * @param {string} sel
 * @param {string|regexp} text
 */
helpers.assertSelText = function(sel, text) {
  var is = require('is');
  this.casper.then(function() {
    this.test['assert' + (is.string(text) ? 'Equals' : 'Match')](
      this.evaluate(function(sel) { return $(sel).text(); }, sel),
      text
    );
  });
};

/**
 * assertType() alternative that reveals the actual type on mismatch.
 *
 * @param {mixed} val
 * @param {string} expected Ex. 'number'
 * @param {string} subject Ex. 'user ID'
 */
helpers.assertType = function(val, expected, subject) {
  this.conjure.then(function() {
    this.test.assertEquals(
      this.utils.betterTypeOf(val),
      expected,
      this.utils.format('%s should be a %s', subject || 'subject', expected)
    );
  });
};

/**
 * casper.each() alternative executes the callback inside the custom then().
 * Callback receives the context of the enclosing then().
 *
 * @param {array} list
 * @param {function} cb Receives (listItem).
 */
helpers.each = function(list, cb) {
  var self = this;
  list.forEach(function(item) {
    self.conjure.then(function() {
      cb.call(this, item);
    });
  });
};

/**
 * Append a fragment ID to the current URL.
 *
 * @param {string} hash Without leading '#'.
 * @param {string} [sel] Optional selector to wait for after navigation.
 */
helpers.openHash = function(hash, sel) {
  this.casper.thenEvaluate(function _openHash(hash) {
    window.location.hash = '#' + hash;
  }, hash);
  if (sel) {
    this.conjure.selectorExists(sel);
  }
};

/**
 * Re-open the initial URL.
 */
helpers.openInitUrl = function() {
  this.casper.thenOpen(this.url(this.get('initPath')));
};

/**
 * require() a CasperJS module or any file relative to --rootdir.
 *
 * @param {string} name Ex. 'casper' or './relative/path/module.js'.
 *   For local file: prefix with leading './'.
 *     If rootdir is /path/to/proj, './foo' will lead to require('/path/to/proj/foo.js').
 * @return {mixed} Loaded module.
 */
helpers.require = function(name) {
  var require = this.get('requireCasper');
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
helpers.selectorExists = function(sel, negate) {
  var self = this;

  this.status(
    'selectorExists',
    'wait',
    {sel: sel, negate: negate}
  );

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
helpers.selectorMissing = function(sel) {
  this.conjure.selectorExists(sel, true);
};

/**
 * sendKeys() alternative that first waits for a selector to exist.
 *
 * @param {string} sel
 * @param {string} keys
 */
helpers.sendKeys = function(sel, keys) {
  this.conjure.selectorExists(sel);
  this.conjure.then(function() {
    this.sendKeys(sel, keys);
  });
};

/**
 * Convert a relative URL into a full.
 *
 * @param {string} relUrl Includes leading slash.
 * @return {string}
 */
helpers.url = function(relUrl) {
  return this.get('baseUrl') + relUrl;
};
