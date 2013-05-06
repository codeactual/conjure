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
 * - `{object} console` `LongCon` instance
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

  this.casper = null;
  this.flow = bddflow.create();
  this.utils = null;
  this.colorizer = null;
  this.running = false;
  this.stackDepth = 0;
  this.pendingHelpers = new PendingHelperIndex();
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
 * Check if `run()` has been called.
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
 * @param {string} name
 * @param {function} cb
 */
Conjure.prototype.test = function(name, cb) {
  this.injectHelpers();
  this.utils = this.require('utils');
  this.colorizer = this.require('colorizer').create('Colorizer');
  this.configureBddflow(name, cb);
  this.casper.start(this.url(this.get('initPath')));
  this.run();
};

/**
 * Configure the `Bddflow` instance.
 *
 * Moved from Conjure.prototype.test to make the sequence stubbable.
 *
 * @param {string} name
 * @param {function} cb
 * @see Bddflow https://github.com/codeactual/bdd-flow/blob/master/docs/Bddflow.md
 * @api private
 */
Conjure.prototype.configureBddflow = function(name, cb) {
  var self = this;

  // Convert `--grep[v] foo bar baz` to `/foo bar baz/`
  var cli = this.get('cli');
  if (cli.options.grep) {
    this.flow.set('grep', new RegExp(cli.args.join(' ')));
  } else if (cli.options.grepv) {
    this.flow.set('grepv', new RegExp(cli.args.join(' ')));
  }

  // Inject these CasperJS modules for convenience
  this.casper = this.require('casper').create(this.get('casperConfig'));
  this.flow.addContextProp('casper', this.casper);
  this.flow.addContextProp('colorizer', this.colorizer);
  this.flow.addContextProp('utils', this.utils);

  // Inject context properties into describe/it callbacks
  this.flow.set('itWrap', function conjureItWrap(name, cb, done) {
    self.casper.then(function conjureItWrapThen() {
      cb.call(this);
    });
    self.casper.then(function conjureItWrapDoneThen() {
      done();
    });
  });
  this.flow.set('describeWrap', function conjureDescribeWrap(name, cb) {
    var contextKeys = ['casper', 'utils', 'colorizer', 'conjure'];
    cb.call(Conjure.createContext(self, contextKeys));
  });

  // Trace describe/it steps
  this.flow.on('describePush', function conjureOnDescribePush(name) {
    self.pushStatus('describe', 'trace', {name: name});
  });
  this.flow.on('describePop', function conjureOnDescribePop(name) {
    self.popStatus();
  });
  this.flow.on('itPush', function conjureOnItPush(name) {
    self.pushStatus('it', 'trace', {name: name});
  });
  this.flow.on('itPop', function conjureOnItPop(name) {
    self.popStatus();
  });

  // Automatic/mandatory assertion of an initial selector (to support common case).
  this.flow.addRootDescribe('initial selector', function conjureRootDescribe() {
    this.it('should match', function conjureInitSelectorShouldExist() {
      this.conjure.selectorExists(self.get('initSel'));
    });
  });
  this.flow.addRootDescribe(name, cb); // User-supplied root describe.

  this.casper.on('step.complete', function() {
    if (typeof this.steps[this.step] !== 'object') { return; }
    var id = this.steps[this.step].__conjure_helper_id;
    if (id) {
      if (!self.pendingHelpers.pop(id)) { // Helper steps completed
        self.popStatus();
      }
    }
  });
};

/**
 * Inject helpers as Conjure properties, bound to this Conjure instance.
 *
 * Moved from Conjure.prototype.test to make the sequence stubbable.
 *
 * @api private
 */
Conjure.prototype.injectHelpers = function() {
  var self = this;
  var bind = requireComponent('bind');
  var extend = requireComponent('extend');

  this.url = bind(this, helpers.url);
  this.require = bind(this, helpers.require);

  this.conjure = {}; // The same `this.conjure` present in test contexts.
  Object.keys(helpers).forEach(function(key) {
    self.conjure[key] = function conjureInjectHelperWrap() {
      // Wrapping pushStatus/popStatus in `then()` is necessary
      // for correct trace order (because a given helper may need to
      // wait for a condition to become true), but significantly increases run time.
      // May be due to internal CasperJS logic that (effectively) gives each
      // `then()` handler a minimum execution time. Its docs do say `then()`
      // will add a 'navigation step'.

     var args = arguments;
      self.casper.then(function() {
        self.pushStatus(key, 'trace');
        helpers[key].apply(self, args);
      });
      self.casper.then(function() { self.popStatus(); });
    };
  });
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

  this.casper.then(function conjureRunBddflow() {
    self.flow.run();
  });

  this.casper.run(function conjureRunCasperTests() {
    this.test.renderResults(true);
  });
};

/**
 * Send internal message to `conjure`.
 *
 * @param {string} source Ex. method name
 * @param {string} type `Status` type
 * @param {object} meta Key/value pairs
 * @see [Status][Status.md]
 * @api private
 */
Conjure.prototype.status = function(source, type, meta) {
  meta = meta || {};

  Object.keys(meta).forEach(function(key) { // Salvage parsable keys, note the rest
    try {
      JSON.stringify(meta[key]);
    } catch (e) {
      meta[key] = {conjureJsonStringifyErr: e.message};
    }
  });

  console.log(this.utils.format(
    'conjure_status:%s',
    JSON.stringify({source: source, type: type, meta: meta, depth: this.stackDepth})
  ));
};

/**
 * Decrement the current stack depth for trace logs.
 */
Conjure.prototype.popStatus = function() {
  this.stackDepth--;
};

/**
 * Increment the current stack depth for trace logs and emit a status
 * event with the name of the depth change source.
 *
 * All args match Conjure.prototype.status.
 */
Conjure.prototype.pushStatus = function(source, type, meta) {
  this.status(source, type, meta);
  this.stackDepth++;
};

/**
 * Send internal trace message to `conjure`.
 *
 * @param {string} source Ex. method name
 * @param {object} meta Key/value pairs
 * @see [Status][Status.md]
 * @api private
 */
Conjure.prototype.trace = function(source, meta) {
  this.status(source, 'trace', meta);
};

/**
 * Methods mixed in to each `it()/then()` context.
 */
var helpers = {};

/**
 * click() alternative that uses jQuery selectors and first waits for a match.
 *
 * @param {string} sel
 * @param {boolean} [nativeClick=false] Use `thenClick()` instead of jQuery's `click()`
 */
helpers.click = function(sel, nativeClick) {
  this.trace('args', {sel: sel, nativeClick: nativeClick});
  this.conjure.selectorExists(sel);
  if (nativeClick) {
    this.casper.thenClick(sel);
  } else {
    this.casper.thenEvaluate(function(sel) {
      $(sel).click();
    }, sel);
  }
};

/**
 * `then()` alternative that with access to the same API as `it()`.
 *
 * @param {function} cb
 */
helpers.then = function(cb) {
  var args = wrapFirstCallbackInConjureContext(this, arguments);
  this.casper.then.apply(this.casper, args);
};

/**
 * `thenOpen()` alternative that with access to the same API as `it()`.
 *
 * @param {mixed} args* Original `thenOpen()` arguments
 * @see thenOpen http://casperjs.org/api.html#casper.thenOpen
 */
helpers.thenOpen = function() {
  var args = wrapFirstCallbackInConjureContext(this, arguments);
  this.trace('args', args[0]);
  this.casper.thenOpen.apply(this.casper, args);
};

/**
 * `assertTextExists()` alternative that uses jQuery selectors.
 *
 * @param {string} sel
 * @param {string|regexp} text
 */
helpers.assertSelText = function(sel, text) {
  var self = this;
  var is = require('is');

  this.trace('args', {sel: sel, text: text});

  this.casper.then(function conjureHelperAssertSelText() {
    self.trace('closure', {type: 'then'});
    this.test['assert' + (is.string(text) ? 'Equals' : 'Match')](
      this.evaluate(function(sel) { return $(sel).text(); }, sel),
      text
    );
  });
};

/**
 * `assertType()` alternative that reveals the actual type on mismatch.
 *
 * @param {mixed} val
 * @param {string} expected Ex. 'number'
 * @param {string} subject Ex. 'user ID'
 */
helpers.assertType = function(val, expected, subject) {
  var self = this;

  this.trace('args', {val: val, expected: expected, subject: subject});

  this.conjure.then(function conjureHelperAssertType() {
    self.trace('closure', {type: 'then'});
    this.test.assertEquals(
      this.utils.betterTypeOf(val),
      expected,
      this.utils.format('%s should be a %s', subject || 'subject', expected)
    );
  });
};

/**
 * `casper.each()` alternative executes the callback inside the custom `then()`.
 * Callback receives the context of the enclosing `then()`.
 *
 * @param {array} list
 * @param {function} cb Receives (listItem).
 */
helpers.each = function(list, cb) {
  var self = this;

  this.trace('args', {list: list});

  list.forEach(function(item) {
    self.trace('closure', {type: 'forEach', item: item});
    self.conjure.then(function conjureHelperEach() {
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
  this.trace('args', {hash: hash, sel: sel});

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
  var url = this.url(this.get('initPath'));
  this.trace('args', {url: url});
  this.casper.thenOpen(url);
};

/**
 * `require()` a CasperJS module or any file relative to `--rootdir`.
 *
 * @param {string} name Ex. 'casper' or './relative/path/module.js'
 *   For local file: prefix with leading './'
 *     If rootdir is '/path/to/proj', './foo' will lead to `require('/path/to/proj/foo.js')`.
 * @return {mixed} Loaded module.
 */
helpers.require = function(name) {
  var require = this.get('requireCasper');
  var relPathRe = /^\.\//;
  if (relPathRe.test(name)) {
    var fullPath = this.get('cli').options.rootdir + '/' + name.replace(relPathRe, '');
    this.trace('args', {name: name, fullPath: fullPath});
    return require(fullPath);
  }
  return require(name); // Ex. 'casper' itself
};

/**
 * Alternative to `waitForSelector()` to use jQuery selector support,
 * ex. ':first' syntax.
 *
 * @param {string} sel
 * @param {boolean} [negate] Use true if selector is not expected to match.
 */
helpers.selectorExists = function(sel, negate) {
  var self = this;

  this.trace('args', {sel: sel, negate: negate});

  this.casper.waitFor(function selectorExistsWaitFor() {
    self.trace('closure', {type: 'waitFor'});
    return this.evaluate(function selectorExistsEvaluate(sel, count) {
      return count === $(sel).length;
    }, sel, negate ? 0 : 1);
  });
  this.casper.then(function selectorExistsThen() {
    self.trace('closure', {type: 'then'});
    this.test.assertTrue(true, (negate ? 'missing' : 'exists') + ': ' + sel);
  });
};

/**
 * Negated `selectorExists()`.
 *
 * @param {string} sel
 */
helpers.selectorMissing = function(sel) {
  this.trace('args', {sel: sel});
  this.conjure.selectorExists(sel, true);
};

/**
 * `sendKeys()` alternative that first waits for a selector to exist.
 *
 * @param {string} sel
 * @param {string} keys
 */
helpers.sendKeys = function(sel, keys) {
  var self = this;

  this.trace('args', {sel: sel, keys: keys});

  this.conjure.selectorExists(sel);
  this.conjure.then(function conjureHelperSendKeys() {
    self.trace('closure', {type: 'then'});
    this.casper.sendKeys(sel, keys);
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

/**
 * Support helpers.then, helpers.thenOpen, etc. by wrapping their callback
 * argument to customize its context.
 *
 * @param {object} self Ex. `this` inside helpers.then
 * @param {object} args Ex `arguments` inside helpers.then
 * @api private
 */
function wrapFirstCallbackInConjureContext(self, args) {
  var extend = require('extend');
  var contextKeys = ['utils', 'colorizer', 'conjure'];
  var context = Conjure.createContext(self, contextKeys);

  args = [].slice.call(args);

  var cb;
  var cbIdx;
  args.forEach(function(val, idx) {
    if (typeof val === 'function') { cb = val; cbIdx = idx; }
  });

  if (cb) {
    args[cbIdx] = function conjureHelperThenOpen() {
      cb.call(extend(context, {casper: self.casper, test: this.test}));
    };
  }

  return args;
}

/**
 * PendingHelperIndex constructor.
 *
 * Each Conjure instance has one index which it uses to tag callbacks before
 * passing them to async CasperJS methods like `then()` and `waitFor()`.
 *
 * The Conjure instance then observes the CasperJS `step.complete` event
 * and updates the index after tagged callbacks finish. After a helper call's
 * inventory of steps are complete, the helper can be considered done and
 * Conjure's stack trace can be updated.
 *
 * The goal of this approach is support that tracing without the run time
 * cost of wrapping the stack pop in a very slow `then()`.
 *
 * Properties:
 *
 * - `{object} index` PendingHelper instances indexed by ID
 * - `{number} nextId` Counter appended to helper names to produce IDs
 *
 * @api private
 */
function PendingHelperIndex() {
  this.index = {};
  this.nextIdSuffix = 0;
}

/**
 * Each helper calls this method early and uses the return object to
 * wrap callbacks to CasperJS methods like `then()` and `waitFor()`.
 *
 * @param {string} name Ex. 'selectorExists'
 * @return {object} PendingHelper instance
 */
PendingHelperIndex.prototype.register = function(name) {
  var id = name + this.nextIdSuffix++;
  this.index[id] = this.index[id] || [];
  var pending = new PendingHelper(id);
  this.index[name].push(pending);
  return pending;
};

/**
 * Update the count of the remaining steps for the identified helper.
 *
 * @param {string} id Ex. 'selectorExists5'
 * @return {number} Remaining steps
 */
PendingHelperIndex.prototype.pop = function(id) {
  return this.index[id].pop();
};

/**
 * PendingHelper constructor.
 *
 * Tracks metadata on pending steps of a single helper call.
 *
 * Properties:
 *
 * - `{string} id` See param
 * - `{number} steps` Remaining steps
 *
 * @param {string} id Ex. 'selectorExists5'
 * @api private
 */
function PendingHelper(id) {
  this.id = id;
  this.steps = 0;
}

/**
 * Wrap a callback before passing it to a CasperJS async method.
 *
 * Tag it with an internal property so we can track its completion
 *
 * @param {function} cb
 * @return {function} Wrapped call to `name`
 * @api private
 */
PendingHelper.prototype._ = function(cb) {
  cb.__conjure_helper_id = this.id;
  return cb;
};

/**
 * Decrement the remaining-step count.
 *
 * @return {number} Remaining steps
 * @api private
 */
PendingHelper.prototype.pop = function() {
  return --this.steps;
};

/**
 * Begin tracking CasperJS step completion for the end of a multi-step helper.
 *
 * @param {string} name Ex. 'selectorExists'
 * @param {array} steps Ex. ['then', 'then']
 * @return {object} PendingHelper instance
 * - Ex. use `instance._(function() { ...})` to wrap a callback argument
 *   before passing it to `then()`, `waitFor()`, etc
 * @api private
 */
Conjure.prototype.startHelper = function(name) {
  return this.pendingHelpers.register(name);
};
