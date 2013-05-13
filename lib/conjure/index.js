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
 * Extend the object that includes functions like `selectorExists()`.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extendAsyncHelpers = function(ext) { return require('extend')(helpers.async, ext); };

/**
 * Extend the object that includes functions like `url()`.
 *
 * @param {object} ext
 * @return {object} Merge result.
 */
exports.extendSyncHelpers = function(ext) { return require('extend')(helpers.sync, ext); };

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
var bddflow = require('weir');
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
 * - `{object} test` CasperJS test API of the current `it()`
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
 * @see Bddflow https://github.com/codeactual/weir/blob/master/docs/Bddflow.md
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
  this.conjure = {}; // The same `this.conjure` present in test contexts.
  this.flow = bddflow.create();
  this.running = false;
  this.stackDepth = 0;

  this.url = bind(this, helpers.sync.url);
  this.require = bind(this, helpers.sync.require);

  this.utils = this.require('utils');
  this.colorizer = this.require('colorizer').create('Colorizer');
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
 * @see Bddflow https://github.com/codeactual/weir/blob/master/docs/Bddflow.md
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
      self.set('test', this.test);
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
    self.set('test', null);
    self.popStatus();
  });

  // Automatic/mandatory assertion of an initial selector (to support common case).
  this.flow.addRootDescribe('initial selector', function conjureRootDescribe() {
    this.it('should match', function conjureInitSelectorShouldExist() {
      this.conjure.selectorExists(self.get('initSel'));
    });
  });
  this.flow.addRootDescribe(name, cb); // User-supplied root describe.

  // See Conjure.prototype.injectHelpers
  this.casper.on('step.complete', function() {
    if (typeof this.steps[this.step] === 'function' && this.steps[this.step].__conjure_helper_last_step) {
      self.popStatus();
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

  Object.keys(helpers.async).forEach(bind(this, this.bindAsyncHelper));
  Object.keys(helpers.sync).forEach(function(key) {
    self.conjure[key] = bind(self, helpers.sync[key]);
  });
};

/**
 * Mix in a helpers.async method.
 *
 * Combined with an `step.complete` event observer, detect the completion
 * of each helper call that produces one or more async steps via CasperJS
 * methods like `then()`.
 *
 * Use `step.complete` insead of `then()`, per helper invocation, because
 * of the significant run time penalty for each added step.
 *
 * @param {string} name
 * @api private
 */
Conjure.prototype.bindAsyncHelper = function(name) {
  var self = this;
  var extend = requireComponent('extend');

  this.conjure[name] = function conjureInjectHelperWrap() {
    var args = arguments;
    var hasPendingStep = false;

    self.pushStatus(name, 'trace');
    var lastStep = function(cb) { // Make `this.lastStep` available in helper
      hasPendingStep = true;
      return conjureTagLastStep(cb);
    };
    var context = extend({}, self, {lastStep: lastStep});

    var result = helpers.async[name].apply(context, args);

    if (!hasPendingStep) { self.popStatus(); }

    return result;
  };
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

  this.flow.run();
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

  // Salvage parsable keys, note the rest
  Object.keys(meta).forEach(function conjureForEachStatusMetaKey(key) {
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
var helpers = {async: {}, sync: {}};

/**
 * click() alternative that uses jQuery selectors and first waits for a match.
 *
 * Usage:
 *
 *     this.conjure.click('body'); // jQuery click
 *     this.conjure.click('body', true); // native CasperJS click
 *
 * @param {string} sel
 * @param {boolean} [nativeClick=false] Use `thenClick()` instead of jQuery's `click()`
 */
helpers.async.click = function(sel, nativeClick) {
  var self = this;
  this.trace('args', {sel: sel, nativeClick: nativeClick});

  this.conjure.selectorExists(sel, false, false);

  if (nativeClick) {
    this.casper.thenClick(sel, this.lastStep(conjureNoOp));
  } else {
    // Incur speed cost of extra then() in order to tag the callback for tracing.
    this.casper.then(this.lastStep(function conjureHelperClickThenEvalThen() {
      self.casper.thenEvaluate(function conjureHelperClickThenEval(sel) {
        $(sel).click();
      }, sel);
    }));
  }
};

/**
 * `then()` alternative that with access to the same API as `it()`.
 *
 * Usage:
 *
 *     this.conjure.then(function() {
 *       var validate = this.conjure.require('./lib/validation.js');
 *       this.test.assert(validate.activationCode(this.casper.fetchText('.act-code')));
 *     });
 *
 * @param {function} cb
 * @param {boolean} [lastStep=true] Use false to prevent stack trace pop.
 * - Ex. Use false in all-but-last-call if a helpers needs to call it multiple time
 */
helpers.async.then = function(lastStep) {
  lastStep = typeof lastStep === 'undefined' ? true : lastStep;
  var args = conjureWrapFirstCallbackInConjureContext(this, arguments, lastStep);
  this.casper.then.apply(this.casper, args);
};

/**
 * `thenOpen()` alternative that with access to the same API as `it()`.
 *
 * Usage:
 *
 *     this.conjure.thenOpen('/login');
 *
 * @param {mixed} args* Original `thenOpen()` arguments
 * @see thenOpen http://casperjs.org/api.html#casper.thenOpen
 */
helpers.async.thenOpen = function() {
  var self = this;
  var args = conjureWrapFirstCallbackInConjureContext(this, arguments, true);

  this.trace('args', {url: args[0]});

  // Incur speed cost of extra then() in order to tag the callback for tracing.
  this.casper.then(this.lastStep(function conjureThenOpenThen() {
    self.casper.thenOpen.apply(self.casper, args);
  }));
};

/**
 * `assertTextExists()` alternative that uses jQuery selectors.
 *
 * Usage:
 *
 *     this.conjure.assertSelText('.username', 'user47');
 *
 * @param {string} sel
 * @param {string|regexp} text
 */
helpers.async.assertSelText = function(sel, text) {
  var self = this;
  var is = require('is');

  this.trace('args', {sel: sel, text: text.toString()});

  this.casper.then(this.lastStep(function conjureHelperAssertSelText() {
    self.trace('closure', {type: 'then'});
    this.test['assert' + (is.string(text) ? 'Equals' : 'Match')](
      this.evaluate(function conjureHelperAssertSelTextEval(sel) {
        return $(sel).text();
      }, sel),
      text
    );
  }));
};

/**
 * `casper.each()` alternative executes the callback inside the custom `then()`.
 * Callback receives the context of the enclosing `then()`.
 *
 * Usage:
 *
 *     var memberAreas = ['download', 'stats', 'collection'];
 *     this.conjure.each(memberAreas, function(area, idx, list) {
 *       this.conjure.thenOpen('/#' + area);
 *       this.conjure.assertSelText('.promote-acct', /Your free trial expires in/);
 *     });
 *
 * @param {array} list
 * @param {function} cb Receives (listItem).
 */
helpers.async.each = function(list, cb) {
  var self = this;
  var length = list.length;

  this.trace('args', {list: list});

  list.forEach(function conjureHelperEachIter(item, idx) {
    self.trace('closure', {type: 'forEach', item: item});
    var cbWrap = function conjureHelperEachThen() {
      cb.call(this, item, idx, list);
    };
    self.conjure.then(cbWrap, idx === length - 1);
  });
};

/**
 * Append a fragment ID to the current URL.
 *
 * Usage:
 *
 *     this.conjure.openHash('inbox');
 *     this.conjure.openHash('inbox', '.msg-actions'); // Then wait for a selector match
 *
 * @param {string} hash Without leading '#'.
 * @param {string} [sel] Optional selector to wait for after navigation.
 */
helpers.async.openHash = function(hash, sel) {
  var self = this;

  this.trace('args', {hash: hash, sel: sel});

  var cb = function conjureOpenHashThenEval(hash) {
    window.location.hash = '#' + hash;
  };

  if (sel) {
    this.casper.thenEvaluate(cb, hash);
    this.conjure.selectorExists(sel);
  } else {
    // Incur speed cost of extra then() in order to tag the callback for tracing.
    this.casper.then(this.lastStep(function conjureOpenHashThen() {
      self.casper.thenEvaluate(cb, hash);
    }));
  }
};

/**
 * Re-open the initial URL.
 */
helpers.async.openInitUrl = function() {
  var url = this.url(this.get('initPath'));
  this.trace('args', {url: url});
  this.casper.thenOpen(url);
};

/**
 * Alternative to `waitForSelector()` to use jQuery selector support,
 * ex. ':first' syntax.
 *
 * Usage:
 *
 *     this.conjure.selectorExists('.inbox');
 *
 *     this.conjure.selectorExists('.inbox', true); // Expect selector absence
 *     this.conjure.selectorExists('.inbox', false); // Default
 *
 *     this.conjure.selectorExists('.inbox', false, false); // Skip stack trace pop
 *     this.conjure.selectorExists('.inbox', false, true); // Default
 *
 *
 * @param {string} sel
 * @param {boolean} [negate] Use true if selector is not expected to match.
 * @param {boolean} [lastStep=true] Use false to prevent stack trace pop.
 * - Ex. Use false in all-but-last-call if a helpers needs to call it multiple time
 */
helpers.async.selectorExists = function(sel, negate, lastStep) {
  var self = this;
  lastStep = typeof lastStep === 'undefined' ? true : lastStep;

  this.trace('args', {sel: sel, negate: negate});

  this.casper.waitFor(function selectorExistsWaitFor() {
    self.trace('closure', {type: 'waitFor'});
    return this.evaluate(function selectorExistsEvaluate(sel, count) {
      return count === $(sel).length;
    }, sel, negate ? 0 : 1);
  });

  var thenWrap = lastStep ? this.lastStep : conjureReturnFirstArg;
  this.casper.then(thenWrap(function selectorExistsThen() {
    self.trace('closure', {type: 'then'});
    this.test.assertTrue(true, (negate ? 'missing' : 'exists') + ': ' + sel);
  }));
};

/**
 * Negated `selectorExists()`.
 *
 * Usage:
 *
 *     this.conjure.selectorMissing('.inbox');
 *
 *     this.conjure.selectorMissing('.inbox', false); // Skip stack trace pop
 *     this.conjure.selectorMissing('.inbox', true); // Default
 *
 * @param {string} sel
 * @param {boolean} [lastStep=true] Use false to prevent stack trace pop.
 * - Ex. Use false in all-but-last-call if a helpers needs to call it multiple time
 */
helpers.async.selectorMissing = function(sel, lastStep) {
  lastStep = typeof lastStep === 'undefined' ? true : lastStep;
  this.trace('args', {sel: sel});
  this.conjure.selectorExists(sel, true, lastStep);
};

/**
 * `sendKeys()` alternative that first waits for a selector to exist.
 *
 * Usage:
 *
 *     this.conjure.sendKeys('.username', 'user47');
 *
 * @param {string} sel
 * @param {string} keys
 */
helpers.async.sendKeys = function(sel, keys) {
  var self = this;

  this.trace('args', {sel: sel, keys: keys});

  this.conjure.selectorExists(sel, false, false);
  this.casper.then(this.lastStep(function conjureHelperSendKeys() {
    self.trace('closure', {type: 'send keys last then'});
    self.casper.sendKeys(sel, keys);
  }));
};

/**
 * `assertType()` alternative that reveals the actual type on mismatch.
 *
 * Usage:
 *
 *     // Identify subject value for error message
 *     this.conjure.assertType(val, 'string', 'username');
 *
 *     this.conjure.assertType(val, 'string'); // Default; label = generic 'subject'
 *
 * @param {mixed} val
 * @param {string} expected Ex. 'number'
 * @param {string} [subject=none] Ex. 'user ID'
 */
helpers.sync.assertType = function(val, expected, subject) {
  var self = this;

  this.trace('args', {val: val, expected: expected, subject: subject});

  this.get('test').assertEquals(
    this.utils.betterTypeOf(val),
    expected,
    this.utils.format('%s should be a %s', subject || 'subject', expected)
  );
};

/**
 * `require()` a CasperJS module or any file relative to `--root-dir`.
 *
 * Usage:
 *
 *     // Equivalent:
 *     this.conjure.require('lib/validation');
 *     this.conjure.require('lib/validation.js');
 *     this.conjure.require('./lib/validation');
 *     this.conjure.require('./lib/validation.js');
 *
 * @param {string} name Ex. 'casper' or `./relative/path/module.js`
 * - For local file: prefix with leading `./`
 * - Ex. './foo' with `--root-dir` is `/path/to/proj` loads `/path/to/proj/foo.js')`
 * @return {mixed}
 */
helpers.sync.require = function(name) {
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
 * Convert a relative URL into a full.
 *
 * Usage:
 *
 *     this.conjure.set('baseUrl', 'http://wwwdev:8000');
 *     this.conjure.test(function() {
 *       // ...
 *       var fullUrl = this.conjure.url('/login'); // 'http://wwwdev:8000/login'
 *     });
 *
 * @param {string} relUrl Includes leading slash.
 * @return {string}
 */
helpers.sync.url = function(relUrl) {
  return this.get('baseUrl') + relUrl;
};

/**
 * Support helpers.then, helpers.thenOpen, etc. by wrapping their callback
 * argument to customize its context.
 *
 * @param {object} self Ex. `this` inside helpers.then
 * @param {object} args Ex `arguments` inside helpers.then
 * @param {boolean} [last=false] True if known to be helper's last step.
 * @api private
 */
function conjureWrapFirstCallbackInConjureContext(self, args, last) {
  var extend = require('extend');
  var contextKeys = ['utils', 'colorizer', 'conjure'];
  var context = Conjure.createContext(self, contextKeys);

  args = [].slice.call(args);

  var cb;
  var cbIdx;
  args.forEach(function conjureFindFirstCallbackArg(val, idx) {
    if (typeof val === 'function') { cb = val; cbIdx = idx; }
  });

  if (cb) {
    args[cbIdx] = function conjureHelperThenOpen() {
      var test = this.test.assertEquals ? this.test : self.get('test');
      cb.call(extend(context, {casper: self.casper, test: test}));
    };

    if (last) {
      args[cbIdx] = self.lastStep(args[cbIdx]);
    }
  }

  return args;
}

/**
 * Tag a callback later passed to a helper's last CasperJS step-producing method,
 * ex. `then()`. Use the tag to later track its completion.
 *
 * @param {function} cb
 * @return {function}
 * @api private
 */
function conjureTagLastStep(cb) {
  cb.__conjure_helper_last_step = true;
  return cb;
}

function conjureNoOp() {}
function conjureReturnFirstArg(arg) { return arg; }
