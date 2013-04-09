;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module.exports) {
    module.exports = {};
    module.client = module.component = true;
    module.call(this, module.exports, require.relative(resolved), module);
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);
  var index = path + '/index.js';

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
  }

  if (require.aliases.hasOwnProperty(index)) {
    return require.aliases[index];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("visionmedia-configurable.js/index.js", Function("exports, require, module",
"\n/**\n * Make `obj` configurable.\n *\n * @param {Object} obj\n * @return {Object} the `obj`\n * @api public\n */\n\nmodule.exports = function(obj){\n\n  /**\n   * Mixin settings.\n   */\n\n  obj.settings = {};\n\n  /**\n   * Set config `name` to `val`, or\n   * multiple with an object.\n   *\n   * @param {String|Object} name\n   * @param {Mixed} val\n   * @return {Object} self\n   * @api public\n   */\n\n  obj.set = function(name, val){\n    if (1 == arguments.length) {\n      for (var key in name) {\n        this.set(key, name[key]);\n      }\n    } else {\n      this.settings[name] = val;\n    }\n\n    return this;\n  };\n\n  /**\n   * Get setting `name`.\n   *\n   * @param {String} name\n   * @return {Mixed}\n   * @api public\n   */\n\n  obj.get = function(name){\n    return this.settings[name];\n  };\n\n  /**\n   * Enable `name`.\n   *\n   * @param {String} name\n   * @return {Object} self\n   * @api public\n   */\n\n  obj.enable = function(name){\n    return this.set(name, true);\n  };\n\n  /**\n   * Disable `name`.\n   *\n   * @param {String} name\n   * @return {Object} self\n   * @api public\n   */\n\n  obj.disable = function(name){\n    return this.set(name, false);\n  };\n\n  /**\n   * Check if `name` is enabled.\n   *\n   * @param {String} name\n   * @return {Boolean}\n   * @api public\n   */\n\n  obj.enabled = function(name){\n    return !! this.get(name);\n  };\n\n  /**\n   * Check if `name` is disabled.\n   *\n   * @param {String} name\n   * @return {Boolean}\n   * @api public\n   */\n\n  obj.disabled = function(name){\n    return ! this.get(name);\n  };\n\n  return obj;\n};//@ sourceURL=visionmedia-configurable.js/index.js"
));
require.register("component-bind/index.js", Function("exports, require, module",
"\n/**\n * Slice reference.\n */\n\nvar slice = [].slice;\n\n/**\n * Bind `obj` to `fn`.\n *\n * @param {Object} obj\n * @param {Function|String} fn or string\n * @return {Function}\n * @api public\n */\n\nmodule.exports = function(obj, fn){\n  if ('string' == typeof fn) fn = obj[fn];\n  if ('function' != typeof fn) throw new Error('bind() requires a function');\n  var args = [].slice.call(arguments, 2);\n  return function(){\n    return fn.apply(obj, args.concat(slice.call(arguments)));\n  }\n};\n//@ sourceURL=component-bind/index.js"
));
require.register("manuelstofer-each/index.js", Function("exports, require, module",
"\"use strict\";\n\nvar nativeForEach = [].forEach;\n\n// Underscore's each function\nmodule.exports = function (obj, iterator, context) {\n    if (obj == null) return;\n    if (nativeForEach && obj.forEach === nativeForEach) {\n        obj.forEach(iterator, context);\n    } else if (obj.length === +obj.length) {\n        for (var i = 0, l = obj.length; i < l; i++) {\n            if (iterator.call(context, obj[i], i, obj) === {}) return;\n        }\n    } else {\n        for (var key in obj) {\n            if (Object.prototype.hasOwnProperty.call(obj, key)) {\n                if (iterator.call(context, obj[key], key, obj) === {}) return;\n            }\n        }\n    }\n};\n//@ sourceURL=manuelstofer-each/index.js"
));
require.register("codeactual-is/index.js", Function("exports, require, module",
"/*jshint node:true*/\n\"use strict\";\n\nvar each = require('each');\nvar types = ['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Array'];\n\neach(types, function (type) {\n  var method = type === 'Function' ? type : type.toLowerCase();\n  module.exports[method] = function (obj) {\n    return Object.prototype.toString.call(obj) === '[object ' + type + ']';\n  };\n});\n\nif (Array.isArray) {\n  module.exports.array = Array.isArray;\n}\n\nmodule.exports.object = function (obj) {\n  return obj === Object(obj);\n};\n\n//@ sourceURL=codeactual-is/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"\n/**\n * toString ref.\n */\n\nvar toString = Object.prototype.toString;\n\n/**\n * Return the type of `val`.\n *\n * @param {Mixed} val\n * @return {String}\n * @api public\n */\n\nmodule.exports = function(val){\n  switch (toString.call(val)) {\n    case '[object Function]': return 'function';\n    case '[object Date]': return 'date';\n    case '[object RegExp]': return 'regexp';\n    case '[object Arguments]': return 'arguments';\n    case '[object Array]': return 'array';\n    case '[object String]': return 'string';\n  }\n\n  if (val === null) return 'null';\n  if (val === undefined) return 'undefined';\n  if (val && val.nodeType === 1) return 'element';\n  if (val === Object(val)) return 'object';\n\n  return typeof val;\n};\n//@ sourceURL=component-type/index.js"
));
require.register("component-each/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar type = require('type');\n\n/**\n * HOP reference.\n */\n\nvar has = Object.prototype.hasOwnProperty;\n\n/**\n * Iterate the given `obj` and invoke `fn(val, i)`.\n *\n * @param {String|Array|Object} obj\n * @param {Function} fn\n * @api public\n */\n\nmodule.exports = function(obj, fn){\n  switch (type(obj)) {\n    case 'array':\n      return array(obj, fn);\n    case 'object':\n      if ('number' == typeof obj.length) return array(obj, fn);\n      return object(obj, fn);\n    case 'string':\n      return string(obj, fn);\n  }\n};\n\n/**\n * Iterate string chars.\n *\n * @param {String} obj\n * @param {Function} fn\n * @api private\n */\n\nfunction string(obj, fn) {\n  for (var i = 0; i < obj.length; ++i) {\n    fn(obj.charAt(i), i);\n  }\n}\n\n/**\n * Iterate object keys.\n *\n * @param {Object} obj\n * @param {Function} fn\n * @api private\n */\n\nfunction object(obj, fn) {\n  for (var key in obj) {\n    if (has.call(obj, key)) {\n      fn(key, obj[key]);\n    }\n  }\n}\n\n/**\n * Iterate array-ish.\n *\n * @param {Array|Object} obj\n * @param {Function} fn\n * @api private\n */\n\nfunction array(obj, fn) {\n  for (var i = 0; i < obj.length; ++i) {\n    fn(obj[i], i);\n  }\n}//@ sourceURL=component-each/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"\nvar indexOf = [].indexOf;\n\nmodule.exports = function(arr, obj){\n  if (indexOf) return arr.indexOf(obj);\n  for (var i = 0; i < arr.length; ++i) {\n    if (arr[i] === obj) return i;\n  }\n  return -1;\n};//@ sourceURL=component-indexof/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar index = require('indexof');\n\n/**\n * Expose `Emitter`.\n */\n\nmodule.exports = Emitter;\n\n/**\n * Initialize a new `Emitter`.\n *\n * @api public\n */\n\nfunction Emitter(obj) {\n  if (obj) return mixin(obj);\n};\n\n/**\n * Mixin the emitter properties.\n *\n * @param {Object} obj\n * @return {Object}\n * @api private\n */\n\nfunction mixin(obj) {\n  for (var key in Emitter.prototype) {\n    obj[key] = Emitter.prototype[key];\n  }\n  return obj;\n}\n\n/**\n * Listen on the given `event` with `fn`.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.on = function(event, fn){\n  this._callbacks = this._callbacks || {};\n  (this._callbacks[event] = this._callbacks[event] || [])\n    .push(fn);\n  return this;\n};\n\n/**\n * Adds an `event` listener that will be invoked a single\n * time then automatically removed.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.once = function(event, fn){\n  var self = this;\n  this._callbacks = this._callbacks || {};\n\n  function on() {\n    self.off(event, on);\n    fn.apply(this, arguments);\n  }\n\n  fn._off = on;\n  this.on(event, on);\n  return this;\n};\n\n/**\n * Remove the given callback for `event` or all\n * registered callbacks.\n *\n * @param {String} event\n * @param {Function} fn\n * @return {Emitter}\n * @api public\n */\n\nEmitter.prototype.off =\nEmitter.prototype.removeListener =\nEmitter.prototype.removeAllListeners = function(event, fn){\n  this._callbacks = this._callbacks || {};\n\n  // all\n  if (0 == arguments.length) {\n    this._callbacks = {};\n    return this;\n  }\n\n  // specific event\n  var callbacks = this._callbacks[event];\n  if (!callbacks) return this;\n\n  // remove all handlers\n  if (1 == arguments.length) {\n    delete this._callbacks[event];\n    return this;\n  }\n\n  // remove specific handler\n  var i = index(callbacks, fn._off || fn);\n  if (~i) callbacks.splice(i, 1);\n  return this;\n};\n\n/**\n * Emit `event` with the given args.\n *\n * @param {String} event\n * @param {Mixed} ...\n * @return {Emitter}\n */\n\nEmitter.prototype.emit = function(event){\n  this._callbacks = this._callbacks || {};\n  var args = [].slice.call(arguments, 1)\n    , callbacks = this._callbacks[event];\n\n  if (callbacks) {\n    callbacks = callbacks.slice(0);\n    for (var i = 0, len = callbacks.length; i < len; ++i) {\n      callbacks[i].apply(this, args);\n    }\n  }\n\n  return this;\n};\n\n/**\n * Return array of callbacks for `event`.\n *\n * @param {String} event\n * @return {Array}\n * @api public\n */\n\nEmitter.prototype.listeners = function(event){\n  this._callbacks = this._callbacks || {};\n  return this._callbacks[event] || [];\n};\n\n/**\n * Check if this emitter has `event` handlers.\n *\n * @param {String} event\n * @return {Boolean}\n * @api public\n */\n\nEmitter.prototype.hasListeners = function(event){\n  return !! this.listeners(event).length;\n};\n//@ sourceURL=component-emitter/index.js"
));
require.register("visionmedia-batch/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\ntry {\n  var EventEmitter = require('events').EventEmitter;\n} catch (err) {\n  var Emitter = require('emitter');\n}\n\n/**\n * Noop.\n */\n\nfunction noop(){}\n\n/**\n * Expose `Batch`.\n */\n\nmodule.exports = Batch;\n\n/**\n * Create a new Batch.\n */\n\nfunction Batch() {\n  this.fns = [];\n  this.concurrency(Infinity);\n  for (var i = 0, len = arguments.length; i < len; ++i) {\n    this.push(arguments[i]);\n  }\n}\n\n/**\n * Inherit from `EventEmitter.prototype`.\n */\n\nif (EventEmitter) {\n  Batch.prototype.__proto__ = EventEmitter.prototype;\n} else {\n  Emitter(Batch.prototype);\n}\n\n/**\n * Set concurrency to `n`.\n *\n * @param {Number} n\n * @return {Batch}\n * @api public\n */\n\nBatch.prototype.concurrency = function(n){\n  this.n = n;\n  return this;\n};\n\n/**\n * Queue a function.\n *\n * @param {Function} fn\n * @return {Batch}\n * @api public\n */\n\nBatch.prototype.push = function(fn){\n  this.fns.push(fn);\n  return this;\n};\n\n/**\n * Execute all queued functions in parallel,\n * executing `cb(err, results)`.\n *\n * @param {Function} cb\n * @return {Batch}\n * @api public\n */\n\nBatch.prototype.end = function(cb){\n  var self = this\n    , total = this.fns.length\n    , pending = total\n    , results = []\n    , cb = cb || noop\n    , fns = this.fns\n    , max = this.n\n    , index = 0\n    , done;\n\n  // empty\n  if (!fns.length) return cb(null, results);\n\n  // process\n  function next() {\n    var i = index++;\n    var fn = fns[i];\n    if (!fn) return;\n    var start = new Date;\n    fn(function(err, res){\n      if (done) return;\n      if (err) return done = true, cb(err);\n      var complete = total - pending + 1;\n      var end = new Date;\n\n      results[i] = res;\n\n      self.emit('progress', {\n        index: i,\n        value: res,\n        pending: pending,\n        total: total,\n        complete: complete,\n        percent: complete / total * 100 | 0,\n        start: start,\n        end: end,\n        duration: end - start\n      });\n\n      if (--pending) next()\n      else cb(null, results);\n    });\n  }\n\n  // concurrency\n  for (var i = 0; i < fns.length; i++) {\n    if (i == max) break;\n    next();\n  }\n\n  return this;\n};\n//@ sourceURL=visionmedia-batch/index.js"
));
require.register("codeactual-outer-shelljs/index.js", Function("exports, require, module",
"/**\n * ShellJS extensions\n *\n * Licensed under MIT.\n * Copyright (c) 2013 David Smith <https://github.com/codeactual/>\n */\n\n/*jshint node:true*/\n'use strict';\n\nmodule.exports = {\n  OuterShelljs: OuterShelljs,\n  create: create,\n  require: require // Allow tests to use component-land require.\n};\n\nvar emitter = require('emitter');\n\nfunction OuterShelljs(shelljs) {\n  this.shelljs = shelljs;\n}\n\nemitter(OuterShelljs.prototype);\n\n/**\n * Recursively find all files that match the given regex.\n *\n * @param {string} parent Root dir of search scope.\n * @param {object} regex RegExp instance.\n * @return {array} Matching shelljs.find() results.\n */\nOuterShelljs.prototype.findByRegex = function(parent, regex) {\n  return this._('find', parent).filter(function(file) {\n    return file.match(regex);\n  });\n};\n\n/**\n * Invoke a native shelljs method.\n *\n * @param {string} method\n * @param {mixed} arg* All other arguments are passed to 'method'.\n */\nOuterShelljs.prototype._ = function(method) {\n  var args = [].slice.call(arguments, 1);\n  var res = this.shelljs[method].apply(this.shelljs, args);\n\n  var eventArgs = ['cmd', method, args, res];\n  this.emit.apply(this, eventArgs);\n\n  eventArgs = ['cmd:' + method, args, res];\n  this.emit.apply(this, eventArgs);\n  return res;\n};\n\nfunction create(shelljs) {\n  return new OuterShelljs(shelljs);\n}\n//@ sourceURL=codeactual-outer-shelljs/index.js"
));
require.register("codeactual-extend/index.js", Function("exports, require, module",
"\nmodule.exports = function extend (object) {\n    // Takes an unlimited number of extenders.\n    var args = Array.prototype.slice.call(arguments, 1);\n\n    // For each extender, copy their properties on our object.\n    for (var i = 0, source; source = args[i]; i++) {\n        if (!source) continue;\n        for (var property in source) {\n            object[property] = source[property];\n        }\n    }\n\n    return object;\n};//@ sourceURL=codeactual-extend/index.js"
));
require.register("qualiancy-tea-properties/lib/properties.js", Function("exports, require, module",
"/*!\n * goodwin - deep object get/set path values\n * Copyright(c) 2012 Jake Luer <jake@alogicalparadox.com>\n * MIT Licensed\n *\n * @website https://github.com/logicalparadox/goodwin/'\n * @issues https://github.com/logicalparadox/goodwin/issues'\n */\n\n/*!\n * Primary exports\n */\n\nvar exports = module.exports = {};\n\n/**\n * ### .get(obj, path)\n *\n * Retrieve the value in an object given a string path.\n *\n * ```js\n * var obj = {\n *     prop1: {\n *         arr: ['a', 'b', 'c']\n *       , str: 'Hello'\n *     }\n *   , prop2: {\n *         arr: [ { nested: 'Universe' } ]\n *       , str: 'Hello again!'\n *     }\n * };\n * ```\n *\n * The following would be the results.\n *\n * ```js\n * var properties = require('tea-properties');\n * properties.get(obj, 'prop1.str'); // Hello\n * properties.get(obj, 'prop1.att[2]'); // b\n * properties.get(obj, 'prop2.arr[0].nested'); // Universe\n * ```\n *\n * @param {Object} object\n * @param {String} path\n * @return {Object} value or `undefined`\n */\n\nexports.get = function (obj, path) {\n  var parsed = parsePath(path);\n  return getPathValue(parsed, obj);\n};\n\n/**\n * ### .set(path, value, object)\n *\n * Define the value in an object at a given string path.\n *\n * ```js\n * var obj = {\n *     prop1: {\n *         arr: ['a', 'b', 'c']\n *       , str: 'Hello'\n *     }\n *   , prop2: {\n *         arr: [ { nested: 'Universe' } ]\n *       , str: 'Hello again!'\n *     }\n * };\n * ```\n *\n * The following would be acceptable.\n *\n * ```js\n * var properties = require('tea-properties');\n * properties.set(obj, 'prop1.str', 'Hello Universe!');\n * properties.set(obj, 'prop1.arr[2]', 'B');\n * properties.set(obj, 'prop2.arr[0].nested.value', { hello: 'universe' });\n * ```\n *\n * @param {Object} object\n * @param {String} path\n * @param {Mixed} value\n * @api public\n */\n\nexports.set = function (obj, path, val) {\n  var parsed = parsePath(path);\n  setPathValue(parsed, val, obj);\n};\n\nfunction defined (val) {\n  return 'undefined' === typeof val;\n}\n\n/*!\n * Helper function used to parse string object\n * paths. Use in conjunction with `getPathValue`.\n *\n *  var parsed = parsePath('myobject.property.subprop');\n *\n * ### Paths:\n *\n * * Can be as near infinitely deep and nested\n * * Arrays are also valid using the formal `myobject.document[3].property`.\n *\n * @param {String} path\n * @returns {Object} parsed\n */\n\nfunction parsePath (path) {\n  var str = path.replace(/\\[/g, '.[')\n    , parts = str.match(/(\\\\\\.|[^.]+?)+/g);\n\n  return parts.map(function (value) {\n    var re = /\\[(\\d+)\\]$/\n      , mArr = re.exec(value)\n    if (mArr) return { i: parseFloat(mArr[1]) };\n    else return { p: value };\n  });\n};\n\n/*!\n * Companion function for `parsePath` that returns\n * the value located at the parsed address.\n *\n *  var value = getPathValue(parsed, obj);\n *\n * @param {Object} parsed definition from `parsePath`.\n * @param {Object} object to search against\n * @returns {Object|Undefined} value\n */\n\nfunction getPathValue (parsed, obj) {\n  var tmp = obj\n    , res;\n\n  for (var i = 0, l = parsed.length; i < l; i++) {\n    var part = parsed[i];\n    if (tmp) {\n      if (!defined(part.p)) tmp = tmp[part.p];\n      else if (!defined(part.i)) tmp = tmp[part.i];\n      if (i == (l - 1)) res = tmp;\n    } else {\n      res = undefined;\n    }\n  }\n\n  return res;\n};\n\n/*!\n * Companion function for `parsePath` that sets\n * the value located at a parsed address.\n *\n *  setPathValue(parsed, 'value', obj);\n *\n * @param {Object} parsed definition from `parsePath`\n * @param {*} value to use upon set\n * @param {Object} object to search and define on\n * @api private\n */\n\nfunction setPathValue (parsed, val, obj) {\n  var tmp = obj;\n\n  for (var i = 0, l = parsed.length; i < l; i++) {\n    var part = parsed[i];\n    if (!defined(tmp)) {\n      if (i == (l - 1)) {\n        if (!defined(part.p)) tmp[part.p] = val;\n        else if (!defined(part.i)) tmp[part.i] = val;\n      } else {\n        if (!defined(part.p) && tmp[part.p]) tmp = tmp[part.p];\n        else if (!defined(part.i) && tmp[part.i]) tmp = tmp[part.i];\n        else {\n          var next = parsed[i + 1];\n          if (!defined(part.p)) {\n            tmp[part.p] = {};\n            tmp = tmp[part.p];\n          } else if (!defined(part.i)) {\n            tmp[part.i] = [];\n            tmp = tmp[part.i]\n          }\n        }\n      }\n    } else {\n      if (i == (l - 1)) tmp = val;\n      else if (!defined(part.p)) tmp = {};\n      else if (!defined(part.i)) tmp = [];\n    }\n  }\n};\n//@ sourceURL=qualiancy-tea-properties/lib/properties.js"
));
require.register("codeactual-sinon-doublist/index.js", Function("exports, require, module",
"/**\n * Sinon.JS test double mixins.\n *\n * Licensed under MIT.\n * Copyright (c) 2013 David Smith <https://github.com/codeactual/>\n */\n\n/*jshint node:true*/\n'use strict';\n\nvar sinonDoublist = module.exports = function(sinon, test, disableAutoSandbox) {\n  if (typeof test === 'string') {\n    globalInjector[test](sinon, disableAutoSandbox);\n    return;\n  }\n\n  Object.keys(mixin).forEach(function(method) {\n    test[method] = bind(test, mixin[method]);\n  });\n  if (!disableAutoSandbox) {\n    test._createSandbox(sinon);\n  }\n};\n\nvar is = require('is');\nvar bind = require('bind');\nvar properties = require('tea-properties');\nvar setPathValue = properties.set;\nvar getPathValue = properties.get;\nvar mixin = {};\nvar browserEnv = typeof window === 'object';\n\nmixin._createSandbox = function(sinon) {\n  var self = this;\n  this.sandbox = sinon.sandbox.create();\n  this.spy = bind(self.sandbox, this.sandbox.spy);\n  this.stub = bind(self.sandbox, this.sandbox.stub);\n  this.mock = bind(self.sandbox, this.sandbox.mock);\n  this.clock = this.sandbox.useFakeTimers();\n  this.server = this.sandbox.useFakeServer();\n  if (browserEnv) {\n    this.requests = this.server.requests;\n  }\n};\n\nmixin.restoreSandbox = function() {\n  this.sandbox.restore();\n};\n\n/**\n * _doubleMany() wrapper configured for 'spy' type.\n *\n * @param {object} obj Double target object.\n * @param {string|array} methods One or more method names/namespaces.\n *   They do not have to exist, e.g. 'obj' and be {} for convenience.\n * @return {object} Stub(s) indexed by method name.\n */\nmixin.spyMany = function(obj, methods) {\n  // Use call() to propagate the context bound in beforeEach().\n  return mixin._doubleMany.call(this, 'spy', obj, methods);\n};\n\n/**\n * _doubleMany() wrapper configured for 'stub' type.\n *\n * @param {object} obj Double target object.\n * @param {string|array} methods One or more method names/namespaces.\n *   They do not have to exist, e.g. 'obj' and be {} for convenience.\n * @return {object} Stub(s) indexed by method name.\n */\nmixin.stubMany = function(obj, methods) {\n  // Use call() to propagate the context bound in beforeEach().\n  return mixin._doubleMany.call(this, 'stub', obj, methods);\n};\n\n/**\n * withArgs()/returns() convenience wrapper.\n *\n * Example use case: SUT is that lib function foo() calls bar()\n * with expected arguments. But one of the arguments to bar()\n * is the return value of baz(). Use this helper to stub baz()\n * out of the picture, to focus on the foo() and bar() relationship.\n *\n * A baz() example is _.bind().\n *\n * @param {object} config\n *   Required:\n *\n *   {string} method` Stub target method name, ex. 'bind'\n *\n *   Optional:\n *\n *   {object} obj Stub target object, ex. underscore.\n *   {array} args Arguments 'method' expects to receive.\n *   {string|array} spies Stub will return an object with spies given these names.\n *     An alternative to setting an explicit returns.\n *   {mixed} returns Stub returns this value.\n *     An alternative to setting  spies.\n * @return {object}\n *   {function} returnedSpy or {object} returnedSpies Depends on whether spies is a string or array.\n *   {function} <method> The created stub. The property name will match the configured method name.\n *   {object} target Input obj, or {} if 'obj' was null.\n * @throws Error If method not specified.\n */\nmixin.stubWithReturn = function(config) {\n  config = config || {};\n\n  var self = this;\n  var stub;\n  var returns;\n  var isReturnsConfigured = config.hasOwnProperty('returns');\n  var payload = {};\n\n  if (!is.string(config.method) || !config.method.length) {\n    throw new Error('method not specified');\n  }\n\n  // Allow test to avoid creating the config.obj ahead of time.\n  if (config.obj) {\n    stub = this.stubMany(config.obj, config.method)[config.method];\n  } else {\n    config.obj = {};\n    stub = this.stubMany(config.obj, config.method)[config.method];\n  }\n\n  // Detect the need for withArgs().\n  if (is.array(config.args) && config.args.length) {\n    stub = stub.withArgs.apply(stub, config.args);\n  }\n\n  // Create the stub return value. Either a spy itself or hash of them.\n  if (config.spies) {\n    returns = {};\n\n    // 'a.b.c.spy1'\n    if (is.string(config.spies) && /\\./.test(config.spies)) {\n      setPathValue(returns, config.spies, this.spy());\n    } else {\n      var spies = [].concat(config.spies);\n      for (var s = 0; s < spies.length; s++) {\n        setPathValue(returns, spies[s], this.spy());\n      }\n    }\n  } else {\n    if (isReturnsConfigured) {\n      returns = config.returns;\n    } else {\n      returns = this.spy();\n    }\n  }\n  stub.returns(returns);\n\n  if (!isReturnsConfigured) {\n    if (is.Function(returns)) {\n      payload.returnedSpy = returns;\n    } else {\n      payload.returnedSpies = returns;\n    }\n  }\n  payload[config.method] = stub;\n  payload.target = config.obj;\n\n  return payload;\n};\n\n/**\n * Spy/stub one or more methods of an object.\n *\n * @param {string} type 'spy' or 'stub'\n * @param {object} obj Double target object.\n * @param {string|array} methods One or more method names/namespaces.\n *   They do not have to exist, e.g. 'obj' and be {} for convenience.\n * @return {object} Stub(s) indexed by method name.\n */\nmixin._doubleMany = function(type, obj, methods) {\n  var self = this;\n  var doubles = {};\n  methods = [].concat(methods);\n\n  for (var m = 0; m < methods.length; m++) {\n    var method = methods[m];\n\n    // Sinon requires doubling target to exist.\n    if (!getPathValue(obj, method)) {\n      setPathValue(obj, method, sinonDoublistNoOp);\n    }\n\n    if (/\\./.test(method)) { // Ex. 'a.b.c'\n      var lastNsPart = method.split('.').slice(-1);  // Ex. 'c'\n      doubles[method] = self[type](\n        getPathValue(obj, method.split('.').slice(0, -1).join('.')), // Ex. 'a.b'\n        method.split('.').slice(-1)  // Ex. 'c'\n      );\n    } else {\n      doubles[method] = self[type](obj, method);\n    }\n  }\n\n  return doubles;\n};\n\nvar globalInjector = {\n  mocha: function(sinon, disableAutoSandbox) {\n    beforeEach(function(done) {\n      sinonDoublist(sinon, this, disableAutoSandbox);\n      done();\n    });\n\n    afterEach(function(done) {\n      this.sandbox.restore();\n      done();\n    });\n  }\n};\n\nfunction sinonDoublistNoOp() {}\n//@ sourceURL=codeactual-sinon-doublist/index.js"
));
require.register("component-clone/index.js", Function("exports, require, module",
"\n/**\n * Module dependencies.\n */\n\nvar type;\n\ntry {\n  type = require('type');\n} catch(e){\n  type = require('type-component');\n}\n\n/**\n * Module exports.\n */\n\nmodule.exports = clone;\n\n/**\n * Clones objects.\n *\n * @param {Mixed} any object\n * @api public\n */\n\nfunction clone(obj){\n  switch (type(obj)) {\n    case 'object':\n      var copy = {};\n      for (var key in obj) {\n        if (obj.hasOwnProperty(key)) {\n          copy[key] = clone(obj[key]);\n        }\n      }\n      return copy;\n\n    case 'array':\n      var copy = new Array(obj.length);\n      for (var i = 0, l = obj.length; i < l; i++) {\n        copy[i] = clone(obj[i]);\n      }\n      return copy;\n\n    case 'regexp':\n      // from millermedeiros/amd-utils - MIT\n      var flags = '';\n      flags += obj.multiline ? 'm' : '';\n      flags += obj.global ? 'g' : '';\n      flags += obj.ignoreCase ? 'i' : '';\n      return new RegExp(obj.source, flags);\n\n    case 'date':\n      return new Date(obj.getTime());\n\n    default: // string, number, boolean, …\n      return obj;\n  }\n}\n//@ sourceURL=component-clone/index.js"
));
require.register("bdd-flow/index.js", Function("exports, require, module",
"/**\n * Build and run BDD flows with before/after hooks, describe, it\n *\n * Licensed under MIT.\n * Copyright (c) 2013 David Smith <https://github.com/codeactual/>\n */\n\n/*jshint node:true*/\n'use strict';\n\nmodule.exports = {\n  Bddflow: Bddflow,\n  create: create,\n  require: require // Allow tests to use component-land require.\n};\n\nvar Batch = require('batch');\nvar bind = require('bind');\nvar clone = require('clone');\nvar configurable = require('configurable.js');\nvar extend = require('extend');\n\n// Match properties that should not be 'inherited' by it(), hooks, etc.\nvar flowFnRegex = /^(it|describe|before|beforeEach|after|afterEach)$/;\nvar defOmitContextRegex = {\n  all: [/^__conjure__/],\n  describe: [],\n  hook: [flowFnRegex],\n  it: [flowFnRegex],\n  rootDescribe: []\n};\n\nfunction create() { return new Bddflow(); }\n\n/**\n * Flow configuration and execution.\n */\nfunction Bddflow() {\n  this.settings = {\n    done: noOp, // Batch#end callback that fires after flow completes.\n\n    // Propagate to each new Describe instance:\n    itWrap: null,\n    describeWrap: null,\n    omitContextRegex: clone(defOmitContextRegex),\n    path: [], // Names of ancestor describe levels to the currently executing it().\n    grep: /.?/, // Filters it() execution by \"current path + it() name\".\n    grepv: null, // Omits it() execution by \"current path + it() name\".\n    sharedContext: {}\n  };\n  this.rootDescribes = [];\n  this.batch = new Batch();\n  this.seedProps = {}; // Will me merged into initial hook/describe/it context.\n  this.running = false;\n}\n\nBddflow.describeConfigKeys = [\n  'describeWrap', 'itWrap', 'omitContextRegex', 'path', 'grep', 'grepv', 'sharedContext'\n];\n\nconfigurable(Bddflow.prototype);\n\n/**\n * Add a property to the initial hook/describe/it shared context.\n *\n * @param {string} key\n * @param {mixed} val\n * @return {object} this\n */\nBddflow.prototype.addContextProp = function(key, val) {\n  this.seedProps[key] = val;\n  return this;\n};\n\n/**\n * Add a top-level describe().\n *\n * @param {string} name\n * @param {function} cb\n */\nBddflow.prototype.addRootDescribe = function(name, cb) {\n  var self = this;\n  var desc = new Describe(name);\n  desc.describe(name, cb, true);\n  this.rootDescribes.push(desc);\n  return this;\n};\n\n/**\n * Prevent a type of flow function from 'inheriting' specific context properties\n * from enclosing/subsequently-executed flow functions.\n *\n * @param {string} 'it', 'hook'\n * @param {object} RegExp instance.\n * @return {object} this\n */\nBddflow.prototype.hideContextProp = function(type, regex) {\n  if (typeof regex === 'string') {\n    regex = new RegExp('^' + regex + '$');\n  }\n  this.get('omitContextRegex')[type].push(regex);\n  return this;\n};\n\n/**\n * Check if run() has been called.\n *\n * @return {boolean}\n */\nBddflow.prototype.isRunning = function() {\n  return this.running;\n};\n\n/**\n * Run collected describe() layers.\n */\nBddflow.prototype.run = function() {\n  var self = this;\n\n  this.running = true;\n\n  var batch = new Batch();\n  batch.concurrency(1);\n  this.set('sharedContext', this.seedProps);\n  this.rootDescribes.forEach(function(desc) {\n    batch.push(function(taskDone) {\n      self.set('path', []);\n      Bddflow.describeConfigKeys.forEach(function(key) {\n        desc.set(key, self.get(key));\n      });\n      runSteps(desc.steps, taskDone);\n    });\n  });\n  batch.end(this.get('done'));\n};\n\n// Auto-terminating callback for use with Batch#push.\nBddflow.defaultHookImpl = function(done) { done(); };\n\n/**\n * Container for a before(), beforeEach(), etc. method set.\n */\nfunction HookSet() {\n  this.before = Bddflow.defaultHookImpl;\n  this.beforeEach = Bddflow.defaultHookImpl;\n  this.after = Bddflow.defaultHookImpl;\n  this.afterEach = Bddflow.defaultHookImpl;\n}\n\n/**\n * @param {string} name Subject expectation.\n * @param {string} name Test subject.\n */\nfunction ItCallback(name, cb) {\n  this.name = name;\n  this.cb = cb;\n}\n\n/**\n * A describe()'s properties, internal hooks, and nested steps (describe/it).\n *\n * @param {string} name Subject expected to exhibit some behavior.\n */\nfunction Describe(name) {\n  this.name = name;\n  this.steps = [];\n  this.hooks = new HookSet();\n  this.settings = {};\n}\nconfigurable(Describe.prototype);\n\nDescribe.prototype.extendSharedContext = function(ext, type) {\n  return extend(this.get('sharedContext'), this.filterProps(ext, type));\n};\n\nDescribe.prototype.filterProps = function(obj, type) {\n  var omitContextRegex = this.get('omitContextRegex');\n  var regex = omitContextRegex.all.concat(omitContextRegex[type]);\n  return Object.keys(obj).reduce(function(memo, key) {\n    var omit = false;\n    regex.forEach(function(re) {\n      omit = omit || re.test(key);\n    });\n    if (omit) {\n      return memo;\n    }\n    memo[key] = obj[key];\n    return memo;\n  }, {});\n};\n\n/**\n * Filter 'this' into an object with properties that can be 'inherited'\n * between hooks/describe/it.\n *\n * Static used in other classes via call(). Exposed for test access.\n *\n * @param {string} type 'describe', 'hook', 'it', 'rootDescribe'\n * @return {object}\n */\nDescribe.prototype.getSharedContext = function(type) {\n  return this.filterProps(this.get('sharedContext'), type);\n};\n\n/**\n * Add an it() step.\n *\n * @param {string} name\n * @param {function} cb Batch#push compat.\n */\nDescribe.prototype.it = function(name, cb) {\n  this.steps.push(new ItCallback(name, cb));\n};\n\n/**\n * Add a describe() step.\n *\n * @param {string} name\n * @param {function} cb Batch#push compat.\n */\nDescribe.prototype.describe = function(name, cb, isRoot) {\n  var self = this;\n  var step = function(done) {\n    var desc = new Describe(name); // Collect nested steps.\n    Bddflow.describeConfigKeys.forEach(function(key) {\n      desc.set(key, self.get(key));\n    });\n    var path = desc.get('path');\n    path.push(name);\n\n    var describeWrap = desc.get('describeWrap') || defDescribeWrap;\n    describeWrap(name, function() {\n      var wrapContext = this || {};\n      var mergedContext = desc.extendSharedContext(wrapContext, 'describe');\n      mergedContext.describe = bind(desc, 'describe');\n      mergedContext.it = bind(desc, 'it');\n      mergedContext.before = bind(desc, 'before');\n      mergedContext.beforeEach = bind(desc, 'beforeEach');\n      mergedContext.after = bind(desc, 'after');\n      mergedContext.afterEach = bind(desc, 'afterEach');\n      addInternalProp(mergedContext, 'name', name);\n      cb.call(mergedContext);\n    });\n\n    var batch = new Batch();\n\n    batch.push(function(done) {\n      function asyncCb() {\n        desc.extendSharedContext(context, 'hook'); // Apply changes.\n        done();\n      }\n      var hook = desc.hooks.before;\n      var context = desc.getSharedContext('hook');\n      if (hook.length) { // Expects callback arg.\n        desc.hooks.before.call(context, asyncCb);\n      } else {\n        desc.hooks.before.call(context);\n        asyncCb();\n      }\n    });\n\n    batch.push(function(done) { // Wrap hooks around each internal describe()/it()\n      desc.steps = desc.steps.map(function(step) {\n        if (step instanceof DescribeCallback) {\n          var context = desc.getSharedContext('describe');\n          return new DescribeCallback(step.name, bind(context, step.cb));\n        }\n\n        var itPath = path.concat(step.name);\n        var grep = desc.get('grep');\n        var grepv = desc.get('grepv');\n        if (grepv) {\n          if (grepv.test(itPath.join(' '))) {\n            return new ItCallback(step.name, batchNoOp);\n          }\n        } else if (grep) {\n          if (!grep.test(itPath.join(' '))) {\n            return new ItCallback(step.name, batchNoOp);\n          }\n        }\n\n        return new ItCallback(step.name, function(done) { // instanceof ItCallback\n          var batch = new Batch();\n          batch.push(function(done) {\n            function asyncCb() {\n              desc.extendSharedContext(context, 'hook'); // Apply changes.\n              done();\n            }\n            var hook = desc.hooks.beforeEach;\n            var context = desc.getSharedContext('hook');\n            if (hook.length) { // Expects callback arg.\n              desc.hooks.beforeEach.call(context, asyncCb);\n            } else {\n              desc.hooks.beforeEach.call(context);\n              asyncCb();\n            }\n          });\n          batch.push(function(done) {\n            var context = desc.getSharedContext('it');\n\n            function asyncCb() {\n              desc.extendSharedContext(context, 'it'); // Apply changes.\n              done();\n            }\n\n            var itWrap = desc.get('itWrap') || defItWrap;\n            itWrap(step.name, function() {\n              var wrapContext = this || {};\n              extend(context, wrapContext);\n              addInternalProp(context, 'name', step.name, true);\n              addInternalProp(context, 'path', itPath, true);\n              if (step.cb.length) { // Expects callback arg.\n                step.cb.call(context, asyncCb);\n              } else {\n                step.cb.call(context);\n                asyncCb();\n              }\n            });\n          });\n          batch.push(function(done) {\n            function asyncCb() {\n              desc.extendSharedContext(context, 'hook'); // Apply changes.\n              done();\n            }\n            var hook = desc.hooks.afterEach;\n            var context = desc.getSharedContext('hook');\n            if (hook.length) { // Expects callback arg.\n              desc.hooks.afterEach.call(context, asyncCb);\n            } else {\n              desc.hooks.afterEach.call(context);\n              asyncCb();\n            }\n          });\n          batch.concurrency(1);\n          batch.end(done);\n        });\n      });\n\n      runSteps(desc.steps, done);\n    });\n\n    batch.push(function(done) {\n      function asyncCb() {\n        desc.extendSharedContext(context, 'hook'); // Apply changes.\n        done();\n      }\n      var hook = desc.hooks.after;\n      var context = desc.getSharedContext('hook');\n      if (hook.length) { // Expects callback arg.\n        desc.hooks.after.call(context, asyncCb);\n      } else {\n        desc.hooks.after.call(context);\n        asyncCb();\n      }\n    });\n\n    batch.concurrency(1);\n    batch.end(done);\n  };\n  this.steps.push(new DescribeCallback(name, step));\n};\n\n/**\n * Override the default no-op before() hook.\n *\n * @param {function} cb\n */\nDescribe.prototype.before = function(cb) { this.hooks.before = cb; };\n\n/**\n * Override the default no-op beforeEach() hook.\n *\n * @param {function} cb\n */\nDescribe.prototype.beforeEach = function(cb) { this.hooks.beforeEach = cb; };\n\n/**\n * Override the default no-op after() hook.\n *\n * @param {function} cb\n */\nDescribe.prototype.after = function(cb) { this.hooks.after = cb; };\n\n/**\n * Override the default no-op afterEach() hook.\n *\n * @param {function} cb\n */\nDescribe.prototype.afterEach = function(cb) { this.hooks.afterEach = cb; };\n\n/**\n * @param {string} name Test subject.\n * @param {function} cb\n */\nfunction DescribeCallback(name, cb) {\n  this.name = name;\n  this.cb = cb;\n}\n\n/**\n * Execute an array of functions w/ Batch.\n *\n * @param {array} steps\n * @param {function} cb Called at completion.\n * @param {number} [concurrency=1]\n */\nfunction runSteps(steps, cb) {\n  var batch = new Batch();\n  batch.concurrency(1);\n  steps.forEach(function(step) { batch.push(step.cb); });\n  batch.end(cb);\n}\n\nfunction noOp() {}\nfunction batchNoOp(taskDone) { taskDone(); }\nfunction defItWrap(name, cb) { cb(); }\nfunction defDescribeWrap(name, cb) { cb(); }\n\nfunction delInternalProp(obj, key) {\n  delete obj['__conjure__' + key];\n}\n\nfunction addInternalProp(obj, key, val, writable) {\n  Object.defineProperty(\n    obj, '__conjure__' + key,\n    {value: val, enumerable: false, configurable: true, writable: !!writable}\n  );\n}\n//@ sourceURL=bdd-flow/index.js"
));
require.register("conjure/index.js", Function("exports, require, module",
"/**\n * Parallel CasperJS runner, BDD flow, module-based tests, API helpers\n *\n * Licensed under MIT.\n * Copyright (c) 2013 David Smith <https://github.com/codeactual/>\n */\n\n/*jshint node:true*/\n/*global window:false, $:false*/\n'use strict';\n\nmodule.exports = {\n  Conjure: Conjure,\n  create: create,\n  mixin: mixin,\n  require: require // Allow tests to use component-land require.\n};\n\nvar bddflow = require('bdd-flow');\nvar bind = require('bind');\nvar configurable = require('configurable.js');\nvar each = require('each');\nvar extend = require('extend');\nvar is = require('is');\n\n/**\n * Allow test scripts to easily create common-case Conjure instances.\n *\n * @param {function} require CasperJS-env require()\n */\nfunction create(require) {\n  return new Conjure(require);\n}\n\n/**\n * Add BDD globals and init configuration.\n *\n * @param {function} require CasperJS-env require()\n */\nfunction Conjure(require) {\n  this.settings = {\n    // Advertised.\n    baseUrl: 'http://localhost:8174', // for url()\n    initPath: '/', // 1st selector to wait for\n    initSel: 'body', // 1st selector to wait for\n    casperConfig: { // Directly passed to CasperJS create()\n      exitOnError: true,\n      logLevel: 'debug',\n      pageSettings: {\n        loadImages: false,\n        loadPlugins: false,\n        XSSAuditingEnabled: true,\n        verbose: true,\n        onError: function(self, m) { self.die('CasperJS onError: ' + m, 1); },\n        onLoadError: function(self, m) { self.die('CasperJS onLoadError: ' + m, 1); }\n      }\n    },\n\n    // Internal.\n    cli: {}, // Native CasperJS CLI interface\n    casperRequire: require // CasperJS-env require()\n  };\n}\n\nconfigurable(Conjure.prototype);\n\n/**\n * Build a context object that includes:\n *\n * - All enumerable keys from the parent.\n * - Where functions are bound to the parent.\n *\n * @param {object} parent\n * @param {string|array} pluck Key(s) from parent to pluck.\n * @param {string|array} omit Key(s) from parent to omit.\n * @return {object}\n */\nConjure.createContext = function(parent, pluck, omit) {\n  pluck = [].concat(pluck || []);\n  omit = [].concat(omit || []);\n  var context = {};\n  var keys = pluck.length ? pluck : Object.keys(parent);\n  each(keys, function(key) {\n    if (-1 !== omit.indexOf(key)) { return; }\n    if (is.Function(parent[key])) {\n      context[key] = bind(parent, parent[key]);\n    } else {\n      context[key] = parent[key];\n    }\n  });\n  return context;\n};\n\n/**\n * Check if (internal) run() has been called.\n *\n * @return {boolean}\n */\nConjure.prototype.isRunning = function() {\n  return this.running;\n};\n\n/**\n * Perform last-minute init based on collected configuration.\n * Silently add an initial describe() to verify initial URL/selector.\n */\nConjure.prototype.test = function(name, cb) {\n  var self = this;\n\n  this.flow = bddflow.create();\n  this.utils = require('utils');\n  this.colorizer = require('colorizer').create('Colorizer');\n  this.running = false;\n\n  var cli = this.get('cli');\n  if (cli.options.grep) { // Convert `--grep[v] foo bar baz` to /foo bar baz/\n    this.flow.set('grep', new RegExp(cli.args.join(' ')));\n  } else if (cli.options.grepv) {\n    this.flow.set('grepv', new RegExp(cli.args.join(' ')));\n  }\n\n  this.casper = this.require('casper').create(this.get('casperConfig'));\n  this.flow.addContextProp('casper', this.casper);\n  this.flow.addContextProp('colorizer', this.colorizer);\n  this.flow.addContextProp('utils', this.utils);\n\n  Object.keys(thenContext).forEach(function(key) {\n    self.flow.addContextProp(key, bind(self, self[key]));\n  });\n\n  this.flow.set('itWrap', function(name, cb) {\n    self.casper.then(function() {\n      cb.call(this);\n    });\n  });\n  this.flow.set('describeWrap', function(name, cb) {\n    var contextKeys = ['casper', 'utils', 'colorizer'].concat(\n      Object.keys(thenContext)\n    );\n    cb.call(Conjure.createContext(self, contextKeys));\n  });\n\n  this.casper.start(this.url(this.get('initPath')));\n\n  var descName = 'initial URL/selector';\n\n  this.flow.addRootDescribe(descName, function() {\n    this.it('should be loaded/found', function() {\n      this.selectorExists(self.get('initSel'));\n    });\n  });\n\n  this.flow.addRootDescribe(name, cb);\n  this.run();\n};\n\n/**\n * Run collected BBD layers.\n */\nConjure.prototype.run = function() {\n  var self = this;\n\n  this.running = true;\n\n  var initSel = this.get('initSel');\n  var initPath = this.get('initPath');\n\n  var initMsg = 'Opening [' + initPath + ']';\n  if (initSel) {\n    initMsg += ' Waiting For Selector [' + initSel + ']';\n  }\n  this.casper.test.info(initMsg);\n\n  this.casper.then(function() {\n    self.flow.run();\n  });\n\n  this.casper.run(function() {\n    this.test.renderResults(true);\n  });\n};\n\n/**\n * Send internal message to `conjure`.\n *\n * @param {string} source Ex. method name.\n * @param {string} type\n *   wait: Details describe a potential timeout cause.\n */\nConjure.prototype.status = function(source, type, detail) {\n  detail = detail || {};\n  detail.statusSource = source;\n  console.log(this.utils.format(\n    'conjure:%s:%s', type, JSON.stringify(detail)\n  ));\n};\n\n/**\n * Methods mixed in to each it()/andThen() context.\n */\nvar thenContext = {};\n\n/**\n * click() alternative that uses jQuery selectors and first waits for a match.\n *\n * @param {string} sel\n */\nthenContext.click = function(sel) {\n  this.selectorExists(sel);\n  this.casper.thenEvaluate(function(sel) {\n    $(sel).click();\n  }, sel);\n};\n\n/**\n * then() wrapper that with access to it() API.\n *\n * @param {function} cb\n */\nthenContext.andThen = function(cb) {\n  var self = this;\n  var contextKeys = [].concat(\n    ['utils', 'colorizer'],\n    Object.keys(thenContext)\n  );\n  var context = Conjure.createContext(this, contextKeys);\n  this.casper.then(function() {\n    cb.call(extend(context, {casper: self.casper, test: this.test}));\n  });\n};\n\n/**\n * assertTextExists() alternative that uses jQuery selectors.\n *\n * @param {string} sel\n * @param {string|regexp} text\n */\nthenContext.assertSelText = function(sel, text) {\n  this.casper.then(function() {\n    this.test['assert' + (is.string(text) ? 'Equals' : 'Match')](\n      this.evaluate(function(sel) {\n        return $(sel).text();\n      }, sel),\n      text\n    );\n  });\n};\n\n/**\n * assertType() alternative that reveals the actual type on mismatch.\n *\n * @param {mixed} val\n * @param {string} expected Ex. 'number'\n * @param {string} subject Ex. 'user ID'\n */\nthenContext.assertType = function(val, expected, subject) {\n  this.andThen(function() {\n    this.test.assertEquals(\n      this.utils.betterTypeOf(val),\n      expected,\n      this.utils.format('%s should be a %s', subject || 'subject', expected)\n    );\n  });\n};\n\n/**\n * casper.each() alternative that injects the same context as the outer it().\n *\n * @param {array} list\n * @param {function} cb Receives (val).\n */\nthenContext.forEach = function(list, cb) {\n  var self = this;\n  this.casper.each(list, function(__self, item) {\n    cb.apply(self, [].slice.call(arguments, 1));\n  });\n};\n\n/**\n * Append a fragment ID to the current URL.\n *\n * @param {string} hash Without leading '#'.\n * @param {string} [sel] Optional selector to wait for after navigation.\n */\nthenContext.openHash = function(hash, sel) {\n  this.casper.thenEvaluate(function _openHash(hash) {\n    window.location.hash = '#' + hash;\n  }, hash);\n  if (sel) {\n    this.selectorExists(sel);\n  }\n};\n\n/**\n * Re-open the initial URL.\n */\nthenContext.openInitUrl = function() {\n  this.casper.thenOpen(this.url(this.get('initPath')));\n};\n\n/**\n * require() any file relative to --rootdir.\n *\n * @param {string} name Prefix with leading './'.\n *  If rootdir is /path/to/proj, './foo' will require /path/to/proj/foo.js.\n * @return {mixed} Loaded module.\n */\nthenContext.require = function(name) {\n  var require = this.get('casperRequire');\n  var relPathRe = /^\\.\\//;\n  if (relPathRe.test(name)) {\n    return require(this.get('cli').options.rootdir + '/' + name.replace(relPathRe, ''));\n  }\n  return require(name); // Ex. 'casper' itself\n};\n\n/**\n * Alternative to waitForSelector() to use jQuery selector support,\n * ex. ':first' syntax.\n *\n * @param {string} sel\n * @param {boolean} [negate] Use true if selector is not expected to match.\n */\nthenContext.selectorExists = function(sel, negate) {\n  var self = this;\n  var jQueryExists = this.casper.evaluate(function() { return typeof $ === 'function'; });\n\n  this.status(\n    'selectorExists',\n    'wait',\n    {sel: sel, negate: negate, jQueryExists: jQueryExists}\n  );\n\n  if (jQueryExists) {\n    this.casper.waitFor(function selectorExistsWaitFor() {\n      return this.evaluate(function selectorExistsEvaluate(sel, count) {\n        return count === $(sel).length;\n      }, sel, negate ? 0 : 1);\n    });\n    this.casper.then(function selectorExistsThen() {\n      this.test.assertTrue(true, (negate ? 'missing' : 'exists') + ': ' + sel);\n    });\n  } else {\n    this.casper['wait' + (negate ? 'While' : 'For') + 'Selector'](sel);\n  }\n};\n\n/**\n * Negated selectorExists().\n *\n * @param {string} sel\n */\nthenContext.selectorMissing = function(sel) {\n  this.selectorExists(sel, true);\n};\n\n/**\n * sendKeys() wrapper that first waits for a selector to exist.\n *\n * @param {string} sel\n * @param {string} keys\n */\nthenContext.thenSendKeys = function(sel, keys) {\n  this.selectorExists(sel);\n  this.andThen(function() {\n    this.sendKeys(sel, keys);\n  });\n};\n\n/**\n * Convert a relative URL into a full.\n *\n * @param {string} relUrl Includes leading slash.\n * @return {string}\n */\nthenContext.url = function(relUrl) {\n  return this.get('baseUrl') + relUrl;\n};\n\nmixin(thenContext);\n\n/**\n * Mix the given function set into Conjure's prototype.\n *\n * @param {object} ext\n */\nfunction mixin(ext) {\n  _mixin(ext, Conjure.prototype);\n}\n\nfunction _mixin(src, dst) {\n  Object.keys(src).forEach(function(key) {\n    if (typeof src[key] === 'function') {\n      dst[key] = src[key];\n    }\n  });\n}\n//@ sourceURL=conjure/index.js"
));
require.alias("visionmedia-configurable.js/index.js", "conjure/deps/configurable.js/index.js");

require.alias("component-bind/index.js", "conjure/deps/bind/index.js");

require.alias("codeactual-is/index.js", "conjure/deps/is/index.js");
require.alias("manuelstofer-each/index.js", "codeactual-is/deps/each/index.js");

require.alias("component-each/index.js", "conjure/deps/each/index.js");
require.alias("component-type/index.js", "component-each/deps/type/index.js");

require.alias("visionmedia-batch/index.js", "conjure/deps/batch/index.js");
require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("codeactual-outer-shelljs/index.js", "conjure/deps/outer-shelljs/index.js");
require.alias("component-emitter/index.js", "codeactual-outer-shelljs/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("codeactual-extend/index.js", "conjure/deps/extend/index.js");

require.alias("codeactual-sinon-doublist/index.js", "conjure/deps/sinon-doublist/index.js");
require.alias("codeactual-is/index.js", "codeactual-sinon-doublist/deps/is/index.js");
require.alias("manuelstofer-each/index.js", "codeactual-is/deps/each/index.js");

require.alias("component-bind/index.js", "codeactual-sinon-doublist/deps/bind/index.js");

require.alias("qualiancy-tea-properties/lib/properties.js", "codeactual-sinon-doublist/deps/tea-properties/lib/properties.js");
require.alias("qualiancy-tea-properties/lib/properties.js", "codeactual-sinon-doublist/deps/tea-properties/index.js");
require.alias("qualiancy-tea-properties/lib/properties.js", "qualiancy-tea-properties/index.js");

require.alias("bdd-flow/index.js", "conjure/deps/bdd-flow/index.js");
require.alias("visionmedia-configurable.js/index.js", "bdd-flow/deps/configurable.js/index.js");

require.alias("codeactual-extend/index.js", "bdd-flow/deps/extend/index.js");

require.alias("component-bind/index.js", "bdd-flow/deps/bind/index.js");

require.alias("visionmedia-batch/index.js", "bdd-flow/deps/batch/index.js");
require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");

require.alias("component-clone/index.js", "bdd-flow/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

if (typeof exports == "object") {
  module.exports = require("conjure");
} else if (typeof define == "function" && define.amd) {
  define(function(){ return require("conjure"); });
} else {
  window["conjure"] = require("conjure");
}})();