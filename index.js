/**
 * Parallel CasperJS runner, BDD flow, module-based tests, API helpers
 *
 * Licensed under MIT.
 * Copyright (c) 2013 David Smith <https://github.com/codeactual/>
 */

/*jshint node:true*/
/*global window:false, $:false, require:true*/
'use strict';

module.exports = {
  Conjure: Conjure,
  create: create,
  mixin: mixin,

  // Allow tests to use component-land require.
  require: require,
  setRequire: function(stub) { require = stub; }
};

var requireComponent = require;
var bddflow = require('bdd-flow');
var configurable = require('configurable.js');

/**
 * Allow test scripts to easily create common-case Conjure instances.
 *
 * @param {function} require CasperJS-env require()
 */
function create(require) {
  return new Conjure(require);
}

/**
 * Add BDD globals and init configuration.
 *
 * @param {function} require CasperJS-env require()
 */
function Conjure(require) {
  var self = this;
  var bind = requireComponent('bind');

  this.settings = {
    // Advertised.
    baseUrl: 'http://localhost:8174', // for url()
    initPath: '/', // 1st selector to wait for
    initSel: 'body', // 1st selector to wait for
    casperConfig: { // Directly passed to CasperJS create()
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
    casperRequire: require // CasperJS-env require()
  };

  this.flow = bddflow.create();
  this.utils = this.require('utils');
  this.colorizer = this.require('colorizer').create('Colorizer');
  this.running = false;

  // Bound helper mixins. Added as a property so mixins refer to others internally.
  this.conjure = {};
  Object.keys(helpers).forEach(function(key) {
    self.conjure[key] = bind(self, self[key]);
  });
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
 * Perform last-minute init based on collected configuration.
 * Silently add an initial describe() to verify initial URL/selector.
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
 *   wait: Details describe a potential timeout cause.
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
helpers.selectorExists = function(sel, negate) {
  var self = this;
  var jQueryExists = this.casper.evaluate(function() { return typeof $ === 'function'; });

  this.status(
    'selectorExists',
    'wait',
    {sel: sel, negate: negate, jQueryExists: jQueryExists}
  );

  if (jQueryExists) {
    this.casper.waitFor(function selectorExistsWaitFor() {
      return this.evaluate(function selectorExistsEvaluate(sel, count) {
        return count === $(sel).length;
      }, sel, negate ? 0 : 1);
    });
    this.casper.then(function selectorExistsThen() {
      this.test.assertTrue(true, (negate ? 'missing' : 'exists') + ': ' + sel);
    });
  } else {
    this.casper['wait' + (negate ? 'While' : 'For') + 'Selector'](sel);
  }
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
 * sendKeys() wrapper that first waits for a selector to exist.
 *
 * @param {string} sel
 * @param {string} keys
 */
helpers.thenSendKeys = function(sel, keys) {
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

mixin(helpers);

/**
 * Mix the given function set into Conjure's prototype.
 *
 * @param {object} ext
 */
function mixin(ext) {
  _mixin(ext, Conjure.prototype);
}

function _mixin(src, dst) {
  Object.keys(src).forEach(function(key) {
    if (typeof src[key] === 'function') {
      dst[key] = src[key];
    }
  });
}
