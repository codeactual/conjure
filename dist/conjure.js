(function() {
    function require(path, parent, orig) {
        var resolved = require.resolve(path);
        if (null == resolved) {
            orig = orig || path;
            parent = parent || "root";
            var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
            err.path = orig;
            err.parent = parent;
            err.require = true;
            throw err;
        }
        var module = require.modules[resolved];
        if (!module.exports) {
            module.exports = {};
            module.client = module.component = true;
            module.call(this, module.exports, require.relative(resolved), module);
        }
        return module.exports;
    }
    require.modules = {};
    require.aliases = {};
    require.resolve = function(path) {
        if (path.charAt(0) === "/") path = path.slice(1);
        var index = path + "/index.js";
        var paths = [ path, path + ".js", path + ".json", path + "/index.js", path + "/index.json" ];
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if (require.modules.hasOwnProperty(path)) return path;
        }
        if (require.aliases.hasOwnProperty(index)) {
            return require.aliases[index];
        }
    };
    require.normalize = function(curr, path) {
        var segs = [];
        if ("." != path.charAt(0)) return path;
        curr = curr.split("/");
        path = path.split("/");
        for (var i = 0; i < path.length; ++i) {
            if (".." == path[i]) {
                curr.pop();
            } else if ("." != path[i] && "" != path[i]) {
                segs.push(path[i]);
            }
        }
        return curr.concat(segs).join("/");
    };
    require.register = function(path, definition) {
        require.modules[path] = definition;
    };
    require.alias = function(from, to) {
        if (!require.modules.hasOwnProperty(from)) {
            throw new Error('Failed to alias "' + from + '", it does not exist');
        }
        require.aliases[to] = from;
    };
    require.relative = function(parent) {
        var p = require.normalize(parent, "..");
        function lastIndexOf(arr, obj) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === obj) return i;
            }
            return -1;
        }
        function localRequire(path) {
            var resolved = localRequire.resolve(path);
            return require(resolved, parent, path);
        }
        localRequire.resolve = function(path) {
            var c = path.charAt(0);
            if ("/" == c) return path.slice(1);
            if ("." == c) return require.normalize(p, path);
            var segs = parent.split("/");
            var i = lastIndexOf(segs, "deps") + 1;
            if (!i) i = 0;
            path = segs.slice(0, i + 1).join("/") + "/deps/" + path;
            return path;
        };
        localRequire.exists = function(path) {
            return require.modules.hasOwnProperty(localRequire.resolve(path));
        };
        return localRequire;
    };
    require.register("codeactual-extend/index.js", function(exports, require, module) {
        module.exports = function extend(object) {
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0, source; source = args[i]; i++) {
                if (!source) continue;
                for (var property in source) {
                    object[property] = source[property];
                }
            }
            return object;
        };
    });
    require.register("manuelstofer-each/index.js", function(exports, require, module) {
        "use strict";
        var nativeForEach = [].forEach;
        module.exports = function(obj, iterator, context) {
            if (obj == null) return;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    if (iterator.call(context, obj[i], i, obj) === {}) return;
                }
            } else {
                for (var key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                        if (iterator.call(context, obj[key], key, obj) === {}) return;
                    }
                }
            }
        };
    });
    require.register("codeactual-is/index.js", function(exports, require, module) {
        "use strict";
        var each = require("each");
        var types = [ "Arguments", "Function", "String", "Number", "Date", "RegExp", "Array" ];
        each(types, function(type) {
            var method = type === "Function" ? type : type.toLowerCase();
            module.exports[method] = function(obj) {
                return Object.prototype.toString.call(obj) === "[object " + type + "]";
            };
        });
        if (Array.isArray) {
            module.exports.array = Array.isArray;
        }
        module.exports.object = function(obj) {
            return obj === Object(obj);
        };
    });
    require.register("component-bind/index.js", function(exports, require, module) {
        var slice = [].slice;
        module.exports = function(obj, fn) {
            if ("string" == typeof fn) fn = obj[fn];
            if ("function" != typeof fn) throw new Error("bind() requires a function");
            var args = [].slice.call(arguments, 2);
            return function() {
                return fn.apply(obj, args.concat(slice.call(arguments)));
            };
        };
    });
    require.register("component-type/index.js", function(exports, require, module) {
        var toString = Object.prototype.toString;
        module.exports = function(val) {
            switch (toString.call(val)) {
              case "[object Function]":
                return "function";

              case "[object Date]":
                return "date";

              case "[object RegExp]":
                return "regexp";

              case "[object Arguments]":
                return "arguments";

              case "[object Array]":
                return "array";

              case "[object String]":
                return "string";
            }
            if (val === null) return "null";
            if (val === undefined) return "undefined";
            if (val && val.nodeType === 1) return "element";
            if (val === Object(val)) return "object";
            return typeof val;
        };
    });
    require.register("component-each/index.js", function(exports, require, module) {
        var type = require("type");
        var has = Object.prototype.hasOwnProperty;
        module.exports = function(obj, fn) {
            switch (type(obj)) {
              case "array":
                return array(obj, fn);

              case "object":
                if ("number" == typeof obj.length) return array(obj, fn);
                return object(obj, fn);

              case "string":
                return string(obj, fn);
            }
        };
        function string(obj, fn) {
            for (var i = 0; i < obj.length; ++i) {
                fn(obj.charAt(i), i);
            }
        }
        function object(obj, fn) {
            for (var key in obj) {
                if (has.call(obj, key)) {
                    fn(key, obj[key]);
                }
            }
        }
        function array(obj, fn) {
            for (var i = 0; i < obj.length; ++i) {
                fn(obj[i], i);
            }
        }
    });
    require.register("component-indexof/index.js", function(exports, require, module) {
        var indexOf = [].indexOf;
        module.exports = function(arr, obj) {
            if (indexOf) return arr.indexOf(obj);
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i] === obj) return i;
            }
            return -1;
        };
    });
    require.register("component-emitter/index.js", function(exports, require, module) {
        var index = require("indexof");
        module.exports = Emitter;
        function Emitter(obj) {
            if (obj) return mixin(obj);
        }
        function mixin(obj) {
            for (var key in Emitter.prototype) {
                obj[key] = Emitter.prototype[key];
            }
            return obj;
        }
        Emitter.prototype.on = function(event, fn) {
            this._callbacks = this._callbacks || {};
            (this._callbacks[event] = this._callbacks[event] || []).push(fn);
            return this;
        };
        Emitter.prototype.once = function(event, fn) {
            var self = this;
            this._callbacks = this._callbacks || {};
            function on() {
                self.off(event, on);
                fn.apply(this, arguments);
            }
            fn._off = on;
            this.on(event, on);
            return this;
        };
        Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = function(event, fn) {
            this._callbacks = this._callbacks || {};
            if (0 == arguments.length) {
                this._callbacks = {};
                return this;
            }
            var callbacks = this._callbacks[event];
            if (!callbacks) return this;
            if (1 == arguments.length) {
                delete this._callbacks[event];
                return this;
            }
            var i = index(callbacks, fn._off || fn);
            if (~i) callbacks.splice(i, 1);
            return this;
        };
        Emitter.prototype.emit = function(event) {
            this._callbacks = this._callbacks || {};
            var args = [].slice.call(arguments, 1), callbacks = this._callbacks[event];
            if (callbacks) {
                callbacks = callbacks.slice(0);
                for (var i = 0, len = callbacks.length; i < len; ++i) {
                    callbacks[i].apply(this, args);
                }
            }
            return this;
        };
        Emitter.prototype.listeners = function(event) {
            this._callbacks = this._callbacks || {};
            return this._callbacks[event] || [];
        };
        Emitter.prototype.hasListeners = function(event) {
            return !!this.listeners(event).length;
        };
    });
    require.register("visionmedia-batch/index.js", function(exports, require, module) {
        try {
            var EventEmitter = require("events").EventEmitter;
        } catch (err) {
            var Emitter = require("emitter");
        }
        function noop() {}
        module.exports = Batch;
        function Batch() {
            this.fns = [];
            this.concurrency(Infinity);
            for (var i = 0, len = arguments.length; i < len; ++i) {
                this.push(arguments[i]);
            }
        }
        if (EventEmitter) {
            Batch.prototype.__proto__ = EventEmitter.prototype;
        } else {
            Emitter(Batch.prototype);
        }
        Batch.prototype.concurrency = function(n) {
            this.n = n;
            return this;
        };
        Batch.prototype.push = function(fn) {
            this.fns.push(fn);
            return this;
        };
        Batch.prototype.end = function(cb) {
            var self = this, total = this.fns.length, pending = total, results = [], cb = cb || noop, fns = this.fns, max = this.n, index = 0, done;
            if (!fns.length) return cb(null, results);
            function next() {
                var i = index++;
                var fn = fns[i];
                if (!fn) return;
                var start = new Date();
                fn(function(err, res) {
                    if (done) return;
                    if (err) return done = true, cb(err);
                    var complete = total - pending + 1;
                    var end = new Date();
                    results[i] = res;
                    self.emit("progress", {
                        index: i,
                        value: res,
                        pending: pending,
                        total: total,
                        complete: complete,
                        percent: complete / total * 100 | 0,
                        start: start,
                        end: end,
                        duration: end - start
                    });
                    if (--pending) next(); else cb(null, results);
                });
            }
            for (var i = 0; i < fns.length; i++) {
                if (i == max) break;
                next();
            }
            return this;
        };
    });
    require.register("visionmedia-configurable.js/index.js", function(exports, require, module) {
        module.exports = function(obj) {
            obj.settings = {};
            obj.set = function(name, val) {
                if (1 == arguments.length) {
                    for (var key in name) {
                        this.set(key, name[key]);
                    }
                } else {
                    this.settings[name] = val;
                }
                return this;
            };
            obj.get = function(name) {
                return this.settings[name];
            };
            obj.enable = function(name) {
                return this.set(name, true);
            };
            obj.disable = function(name) {
                return this.set(name, false);
            };
            obj.enabled = function(name) {
                return !!this.get(name);
            };
            obj.disabled = function(name) {
                return !this.get(name);
            };
            return obj;
        };
    });
    require.register("component-clone/index.js", function(exports, require, module) {
        var type;
        try {
            type = require("type");
        } catch (e) {
            type = require("type-component");
        }
        module.exports = clone;
        function clone(obj) {
            switch (type(obj)) {
              case "object":
                var copy = {};
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        copy[key] = clone(obj[key]);
                    }
                }
                return copy;

              case "array":
                var copy = new Array(obj.length);
                for (var i = 0, l = obj.length; i < l; i++) {
                    copy[i] = clone(obj[i]);
                }
                return copy;

              case "regexp":
                var flags = "";
                flags += obj.multiline ? "m" : "";
                flags += obj.global ? "g" : "";
                flags += obj.ignoreCase ? "i" : "";
                return new RegExp(obj.source, flags);

              case "date":
                return new Date(obj.getTime());

              default:
                return obj;
            }
        }
    });
    require.register("bdd-flow/lib/bdd-flow/index.js", function(exports, require, module) {
        "use strict";
        exports.Bddflow = Bddflow;
        exports.create = function() {
            return new Bddflow();
        };
        exports.extend = function(ext) {
            return extend(Bddflow.prototype, ext);
        };
        exports.requireComponent = require;
        var Batch = require("batch");
        var clone = require("clone");
        var configurable = require("configurable.js");
        var extend = require("extend");
        var flowFnRegex = /^(it|describe|before|beforeEach|after|afterEach)$/;
        var defOmitContextRegex = {
            all: [ /^__conjure__/ ],
            describe: [],
            hook: [ flowFnRegex ],
            it: [ flowFnRegex ],
            rootDescribe: []
        };
        function Bddflow() {
            this.settings = {
                done: noOp,
                itWrap: null,
                describeWrap: null,
                omitContextRegex: clone(defOmitContextRegex),
                path: [],
                grep: /.?/,
                grepv: null,
                sharedContext: {}
            };
            this.rootDescribes = [];
            this.batch = new Batch();
            this.seedProps = {};
        }
        Bddflow.describeConfigKeys = [ "describeWrap", "itWrap", "omitContextRegex", "path", "grep", "grepv", "sharedContext" ];
        configurable(Bddflow.prototype);
        Bddflow.prototype.addContextProp = function(key, val) {
            this.seedProps[key] = val;
            return this;
        };
        Bddflow.prototype.addRootDescribe = function(name, cb) {
            var self = this;
            var desc = new Describe(name);
            desc.describe(name, cb);
            this.rootDescribes.push(desc);
            return this;
        };
        Bddflow.prototype.hideContextProp = function(type, regex) {
            if (typeof regex === "string") {
                regex = new RegExp("^" + regex + "$");
            }
            this.get("omitContextRegex")[type].push(regex);
            return this;
        };
        Bddflow.prototype.run = function() {
            var self = this;
            var batch = new Batch();
            batch.concurrency(1);
            this.set("sharedContext", this.seedProps);
            this.rootDescribes.forEach(function(desc) {
                batch.push(function(taskDone) {
                    self.set("path", []);
                    Bddflow.describeConfigKeys.forEach(function(key) {
                        desc.set(key, self.get(key));
                    });
                    runSteps(desc.steps, taskDone);
                });
            });
            batch.end(this.get("done"));
        };
        Bddflow.defaultHookImpl = function(done) {
            done();
        };
        function HookSet() {
            this.before = Bddflow.defaultHookImpl;
            this.beforeEach = Bddflow.defaultHookImpl;
            this.after = Bddflow.defaultHookImpl;
            this.afterEach = Bddflow.defaultHookImpl;
        }
        function ItCallback(name, cb) {
            this.name = name;
            this.cb = cb;
        }
        function Describe(name) {
            this.name = name;
            this.steps = [];
            this.hooks = new HookSet();
            this.settings = {};
        }
        configurable(Describe.prototype);
        Describe.prototype.extendSharedContext = function(ext, type) {
            return extend(this.get("sharedContext"), this.filterProps(ext, type));
        };
        Describe.prototype.filterProps = function(obj, type) {
            var omitContextRegex = this.get("omitContextRegex");
            var regex = omitContextRegex.all.concat(omitContextRegex[type]);
            return Object.keys(obj).reduce(function(memo, key) {
                var omit = false;
                regex.forEach(function(re) {
                    omit = omit || re.test(key);
                });
                if (omit) {
                    return memo;
                }
                memo[key] = obj[key];
                return memo;
            }, {});
        };
        Describe.prototype.getSharedContext = function(type) {
            return this.filterProps(this.get("sharedContext"), type);
        };
        Describe.prototype.it = function(name, cb) {
            this.steps.push(new ItCallback(name, cb));
        };
        Describe.prototype.describe = function(name, cb) {
            var self = this;
            var step = function(done) {
                var desc = new Describe(name);
                Bddflow.describeConfigKeys.forEach(function(key) {
                    desc.set(key, self.get(key));
                });
                var path = desc.get("path");
                path.push(name);
                var describeWrap = desc.get("describeWrap") || defDescribeWrap;
                describeWrap(name, function() {
                    var wrapContext = this || {};
                    var mergedContext = desc.extendSharedContext(wrapContext, "describe");
                    mergedContext.describe = desc.describe.bind(desc);
                    mergedContext.it = desc.it.bind(desc);
                    mergedContext.before = desc.before.bind(desc);
                    mergedContext.beforeEach = desc.beforeEach.bind(desc);
                    mergedContext.after = desc.after.bind(desc);
                    mergedContext.afterEach = desc.afterEach.bind(desc);
                    addInternalProp(mergedContext, "name", name);
                    cb.call(mergedContext);
                });
                var batch = new Batch();
                batch.push(function(done) {
                    function asyncCb() {
                        desc.extendSharedContext(context, "hook");
                        done();
                    }
                    var hook = desc.hooks.before;
                    var context = desc.getSharedContext("hook");
                    if (hook.length) {
                        desc.hooks.before.call(context, asyncCb);
                    } else {
                        desc.hooks.before.call(context);
                        asyncCb();
                    }
                });
                batch.push(function(done) {
                    desc.steps = desc.steps.map(function(step) {
                        if (step instanceof DescribeCallback) {
                            var context = desc.getSharedContext("describe");
                            return new DescribeCallback(step.name, step.cb.bind(context));
                        }
                        var itPath = path.concat(step.name);
                        var grep = desc.get("grep");
                        var grepv = desc.get("grepv");
                        if (grepv) {
                            if (grepv.test(itPath.join(" "))) {
                                return new ItCallback(step.name, batchNoOp);
                            }
                        } else if (grep) {
                            if (!grep.test(itPath.join(" "))) {
                                return new ItCallback(step.name, batchNoOp);
                            }
                        }
                        return new ItCallback(step.name, function(done) {
                            var batch = new Batch();
                            batch.push(function(done) {
                                function asyncCb() {
                                    desc.extendSharedContext(context, "hook");
                                    done();
                                }
                                var hook = desc.hooks.beforeEach;
                                var context = desc.getSharedContext("hook");
                                if (hook.length) {
                                    desc.hooks.beforeEach.call(context, asyncCb);
                                } else {
                                    desc.hooks.beforeEach.call(context);
                                    asyncCb();
                                }
                            });
                            batch.push(function(done) {
                                var context = desc.getSharedContext("it");
                                function asyncCb() {
                                    desc.extendSharedContext(context, "it");
                                    done();
                                }
                                var itWrap = desc.get("itWrap") || defItWrap;
                                itWrap(step.name, function() {
                                    var wrapContext = this || {};
                                    extend(context, wrapContext);
                                    addInternalProp(context, "name", step.name, true);
                                    addInternalProp(context, "path", itPath, true);
                                    if (step.cb.length) {
                                        step.cb.call(context, asyncCb);
                                    } else {
                                        step.cb.call(context);
                                        asyncCb();
                                    }
                                });
                            });
                            batch.push(function(done) {
                                function asyncCb() {
                                    desc.extendSharedContext(context, "hook");
                                    done();
                                }
                                var hook = desc.hooks.afterEach;
                                var context = desc.getSharedContext("hook");
                                if (hook.length) {
                                    desc.hooks.afterEach.call(context, asyncCb);
                                } else {
                                    desc.hooks.afterEach.call(context);
                                    asyncCb();
                                }
                            });
                            batch.concurrency(1);
                            batch.end(done);
                        });
                    });
                    runSteps(desc.steps, done);
                });
                batch.push(function(done) {
                    function asyncCb() {
                        desc.extendSharedContext(context, "hook");
                        done();
                    }
                    var hook = desc.hooks.after;
                    var context = desc.getSharedContext("hook");
                    if (hook.length) {
                        desc.hooks.after.call(context, asyncCb);
                    } else {
                        desc.hooks.after.call(context);
                        asyncCb();
                    }
                });
                batch.concurrency(1);
                batch.end(done);
            };
            this.steps.push(new DescribeCallback(name, step));
        };
        Describe.prototype.before = function(cb) {
            this.hooks.before = cb;
        };
        Describe.prototype.beforeEach = function(cb) {
            this.hooks.beforeEach = cb;
        };
        Describe.prototype.after = function(cb) {
            this.hooks.after = cb;
        };
        Describe.prototype.afterEach = function(cb) {
            this.hooks.afterEach = cb;
        };
        function DescribeCallback(name, cb) {
            this.name = name;
            this.cb = cb;
        }
        function runSteps(steps, cb) {
            var batch = new Batch();
            batch.concurrency(1);
            steps.forEach(function(step) {
                batch.push(step.cb);
            });
            batch.end(cb);
        }
        function noOp() {}
        function batchNoOp(taskDone) {
            taskDone();
        }
        function defItWrap(name, cb) {
            cb();
        }
        function defDescribeWrap(name, cb) {
            cb();
        }
        function delInternalProp(obj, key) {
            delete obj["__conjure__" + key];
        }
        function addInternalProp(obj, key, val, writable) {
            Object.defineProperty(obj, "__conjure__" + key, {
                value: val,
                enumerable: false,
                configurable: true,
                writable: !!writable
            });
        }
    });
    require.register("component-to-function/index.js", function(exports, require, module) {
        module.exports = toFunction;
        function toFunction(obj) {
            switch ({}.toString.call(obj)) {
              case "[object Object]":
                return objectToFunction(obj);

              case "[object Function]":
                return obj;

              case "[object String]":
                return stringToFunction(obj);

              case "[object RegExp]":
                return regexpToFunction(obj);

              default:
                return defaultToFunction(obj);
            }
        }
        function defaultToFunction(val) {
            return function(obj) {
                return val === obj;
            };
        }
        function regexpToFunction(re) {
            return function(obj) {
                return re.test(obj);
            };
        }
        function stringToFunction(str) {
            if (/^ *\W+/.test(str)) return new Function("_", "return _ " + str);
            return new Function("_", "return _." + str);
        }
        function objectToFunction(obj) {
            var match = {};
            for (var key in obj) {
                match[key] = typeof obj[key] === "string" ? defaultToFunction(obj[key]) : toFunction(obj[key]);
            }
            return function(val) {
                if (typeof val !== "object") return false;
                for (var key in match) {
                    if (!(key in val)) return false;
                    if (!match[key](val[key])) return false;
                }
                return true;
            };
        }
    });
    require.register("component-enumerable/index.js", function(exports, require, module) {
        var toFunction = require("to-function"), proto = {};
        module.exports = Enumerable;
        function mixin(obj) {
            for (var key in proto) obj[key] = proto[key];
            obj.__iterate__ = obj.__iterate__ || defaultIterator;
            return obj;
        }
        function Enumerable(obj) {
            if (!(this instanceof Enumerable)) {
                if (Array.isArray(obj)) return new Enumerable(obj);
                return mixin(obj);
            }
            this.obj = obj;
        }
        function defaultIterator() {
            var self = this;
            return {
                length: function() {
                    return self.length;
                },
                get: function(i) {
                    return self[i];
                }
            };
        }
        Enumerable.prototype.inspect = Enumerable.prototype.toString = function() {
            return "[Enumerable " + JSON.stringify(this.obj) + "]";
        };
        Enumerable.prototype.__iterate__ = function() {
            var obj = this.obj;
            obj.__iterate__ = obj.__iterate__ || defaultIterator;
            return obj.__iterate__();
        };
        proto.each = function(fn) {
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                fn(vals.get(i), i);
            }
            return this;
        };
        proto.map = function(fn) {
            fn = toFunction(fn);
            var vals = this.__iterate__();
            var len = vals.length();
            var arr = [];
            for (var i = 0; i < len; ++i) {
                arr.push(fn(vals.get(i), i));
            }
            return new Enumerable(arr);
        };
        proto.select = function(fn) {
            fn = toFunction(fn);
            var val;
            var arr = [];
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (fn(val, i)) arr.push(val);
            }
            return new Enumerable(arr);
        };
        proto.unique = function() {
            var val;
            var arr = [];
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (~arr.indexOf(val)) continue;
                arr.push(val);
            }
            return new Enumerable(arr);
        };
        proto.reject = function(fn) {
            var val;
            var arr = [];
            var vals = this.__iterate__();
            var len = vals.length();
            if ("string" == typeof fn) fn = toFunction(fn);
            if (fn) {
                for (var i = 0; i < len; ++i) {
                    val = vals.get(i);
                    if (!fn(val, i)) arr.push(val);
                }
            } else {
                for (var i = 0; i < len; ++i) {
                    val = vals.get(i);
                    if (val != fn) arr.push(val);
                }
            }
            return new Enumerable(arr);
        };
        proto.compact = function() {
            return this.reject(null);
        };
        proto.find = function(fn) {
            fn = toFunction(fn);
            var val;
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (fn(val, i)) return val;
            }
        };
        proto.findLast = function(fn) {
            fn = toFunction(fn);
            var ret;
            var val;
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (fn(val, i)) ret = val;
            }
            return ret;
        };
        proto.all = proto.every = function(fn) {
            fn = toFunction(fn);
            var val;
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (!fn(val, i)) return false;
            }
            return true;
        };
        proto.none = function(fn) {
            fn = toFunction(fn);
            var val;
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (fn(val, i)) return false;
            }
            return true;
        };
        proto.any = function(fn) {
            fn = toFunction(fn);
            var val;
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (fn(val, i)) return true;
            }
            return false;
        };
        proto.count = function(fn) {
            var val;
            var vals = this.__iterate__();
            var len = vals.length();
            var n = 0;
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (fn(val, i)) ++n;
            }
            return n;
        };
        proto.indexOf = function(obj) {
            var val;
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (val === obj) return i;
            }
            return -1;
        };
        proto.has = function(obj) {
            return !!~this.indexOf(obj);
        };
        proto.grep = function(re) {
            var val;
            var vals = this.__iterate__();
            var len = vals.length();
            var arr = [];
            for (var i = 0; i < len; ++i) {
                val = vals.get(i);
                if (re.test(val)) arr.push(val);
            }
            return new Enumerable(arr);
        };
        proto.reduce = function(fn, init) {
            var val;
            var i = 0;
            var vals = this.__iterate__();
            var len = vals.length();
            val = null == init ? vals.get(i++) : init;
            for (;i < len; ++i) {
                val = fn(val, vals.get(i), i);
            }
            return val;
        };
        proto.max = function(fn) {
            var val;
            var n = 0;
            var max = 0;
            var vals = this.__iterate__();
            var len = vals.length();
            if (fn) {
                fn = toFunction(fn);
                for (var i = 0; i < len; ++i) {
                    n = fn(vals.get(i), i);
                    max = n > max ? n : max;
                }
            } else {
                for (var i = 0; i < len; ++i) {
                    n = vals.get(i);
                    max = n > max ? n : max;
                }
            }
            return max;
        };
        proto.sum = function(fn) {
            var ret;
            var n = 0;
            var vals = this.__iterate__();
            var len = vals.length();
            if (fn) {
                fn = toFunction(fn);
                for (var i = 0; i < len; ++i) {
                    n += fn(vals.get(i), i);
                }
            } else {
                for (var i = 0; i < len; ++i) {
                    n += vals.get(i);
                }
            }
            return n;
        };
        proto.avg = proto.mean = function(fn) {
            var ret;
            var n = 0;
            var vals = this.__iterate__();
            var len = vals.length();
            if (fn) {
                fn = toFunction(fn);
                for (var i = 0; i < len; ++i) {
                    n += fn(vals.get(i), i);
                }
            } else {
                for (var i = 0; i < len; ++i) {
                    n += vals.get(i);
                }
            }
            return n / len;
        };
        proto.first = function(n) {
            if ("function" == typeof n) return this.find(n);
            var vals = this.__iterate__();
            if (n) {
                var len = Math.min(n, vals.length());
                var arr = new Array(len);
                for (var i = 0; i < len; ++i) {
                    arr[i] = vals.get(i);
                }
                return arr;
            }
            return vals.get(0);
        };
        proto.last = function(n) {
            if ("function" == typeof n) return this.findLast(n);
            var vals = this.__iterate__();
            var len = vals.length();
            if (n) {
                var i = Math.max(0, len - n);
                var arr = [];
                for (;i < len; ++i) {
                    arr.push(vals.get(i));
                }
                return arr;
            }
            return vals.get(len - 1);
        };
        proto.inGroupsOf = function(n) {
            var arr = [];
            var group = [];
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                group.push(vals.get(i));
                if ((i + 1) % n == 0) {
                    arr.push(group);
                    group = [];
                }
            }
            if (group.length) arr.push(group);
            return new Enumerable(arr);
        };
        proto.at = function(i) {
            return this.__iterate__().get(i);
        };
        proto.toJSON = proto.array = function() {
            var arr = [];
            var vals = this.__iterate__();
            var len = vals.length();
            for (var i = 0; i < len; ++i) {
                arr.push(vals.get(i));
            }
            return arr;
        };
        proto.value = function() {
            return this.obj;
        };
        mixin(Enumerable.prototype);
    });
    require.register("enumerable-prop/lib/enumerable-prop/index.js", function(exports, require, module) {
        "use strict";
        module.exports = enumerableProp;
        var enumerable = require("enumerable");
        var defaultConfig = {
            prop: "list"
        };
        function enumerableProp(instance, config) {
            config = config || {};
            Object.keys(defaultConfig).forEach(function(key) {
                config[key] = config[key] || defaultConfig[key];
            });
            instance[config.prop] = [];
            instance.__iterate__ = createIterator(instance, config.prop);
            instance.push = createPusher(instance, config.prop);
            if (!instance.constructor.prototype.count) {
                enumerable(instance.constructor.prototype);
            }
        }
        function createIterator(instance, prop) {
            return function() {
                return {
                    length: function() {
                        return instance[prop].length;
                    },
                    get: function(i) {
                        return instance[prop][i];
                    }
                };
            };
        }
        function createPusher(instance, prop) {
            if (instance.constructor.prototype.push) {
                return instance.constructor.prototype.push;
            }
            return function(item) {
                return instance[prop].push(item);
            };
        }
    });
    require.register("conjure/lib/conjure/index.js", function(exports, require, module) {
        "use strict";
        exports.Conjure = Conjure;
        exports.create = function(requireCasper) {
            return new Conjure(requireCasper);
        };
        exports.extendConjure = function(ext) {
            return require("extend")(Conjure.prototype, ext);
        };
        exports.extendHelpers = function(ext) {
            return require("extend")(helpers, ext);
        };
        exports.requireComponent = require;
        exports.setRequire = function(stub) {
            require = stub;
        };
        var requireComponent = require;
        var bddflow = require("bdd-flow");
        var configurable = require("configurable.js");
        function Conjure(requireCasper) {
            var self = this;
            var bind = requireComponent("bind");
            this.settings = {
                baseUrl: "http://localhost:8174",
                initPath: "/",
                initSel: "body",
                casperConfig: {
                    exitOnError: true,
                    logLevel: "debug",
                    pageSettings: {
                        loadImages: false,
                        loadPlugins: false,
                        XSSAuditingEnabled: true,
                        verbose: true,
                        onError: function(self, m) {
                            self.die("CasperJS onError: " + m, 1);
                        },
                        onLoadError: function(self, m) {
                            self.die("CasperJS onLoadError: " + m, 1);
                        }
                    }
                },
                cli: {},
                requireCasper: requireCasper
            };
            requireComponent("extend")(this, helpers);
            this.conjure = {};
            Object.keys(helpers).forEach(function(key) {
                self.conjure[key] = bind(self, self[key]);
            });
            this.flow = bddflow.create();
            this.utils = this.require("utils");
            this.colorizer = this.require("colorizer").create("Colorizer");
            this.running = false;
        }
        configurable(Conjure.prototype);
        Conjure.createContext = function(parent, pluck, omit) {
            var bind = require("bind");
            var each = require("each");
            var is = require("is");
            pluck = [].concat(pluck || []);
            omit = [].concat(omit || []);
            var context = {};
            var keys = pluck.length ? pluck : Object.keys(parent);
            each(keys, function(key) {
                if (-1 !== omit.indexOf(key)) {
                    return;
                }
                if (is.Function(parent[key])) {
                    context[key] = bind(parent, parent[key]);
                } else {
                    context[key] = parent[key];
                }
            });
            return context;
        };
        Conjure.prototype.isRunning = function() {
            return this.running;
        };
        Conjure.prototype.test = function(name, cb) {
            var self = this;
            var cli = this.get("cli");
            if (cli.options.grep) {
                this.flow.set("grep", new RegExp(cli.args.join(" ")));
            } else if (cli.options.grepv) {
                this.flow.set("grepv", new RegExp(cli.args.join(" ")));
            }
            this.casper = this.require("casper").create(this.get("casperConfig"));
            this.flow.addContextProp("casper", this.casper);
            this.flow.addContextProp("colorizer", this.colorizer);
            this.flow.addContextProp("utils", this.utils);
            this.flow.set("itWrap", function conjureItWrap(name, cb) {
                self.status("it", "trace", {
                    name: name,
                    origin: "Conjure#test"
                });
                self.casper.then(function conjureItWrapThen() {
                    cb.call(this);
                });
            });
            this.flow.set("describeWrap", function conjureDescribeWrap(name, cb) {
                self.status("describe", "trace", {
                    name: name,
                    origin: "Conjure#test"
                });
                var contextKeys = [ "casper", "utils", "colorizer", "conjure" ];
                cb.call(Conjure.createContext(self, contextKeys));
            });
            this.casper.start(this.url(this.get("initPath")));
            var descName = "initial URL/selector";
            this.flow.addRootDescribe(descName, function conjureRootDescribe() {
                this.it("should be loaded/found", function conjureInitSelectorShouldExist() {
                    this.conjure.selectorExists(self.get("initSel"));
                });
            });
            this.flow.addRootDescribe(name, cb);
            this.run();
        };
        Conjure.prototype.run = function() {
            var self = this;
            this.running = true;
            var initSel = this.get("initSel");
            var initPath = this.get("initPath");
            var initMsg = "Opening [" + initPath + "]";
            if (initSel) {
                initMsg += " Waiting For Selector [" + initSel + "]";
            }
            this.casper.test.info(initMsg);
            this.casper.then(function conjureRunBddflow() {
                self.flow.run();
            });
            this.casper.run(function conjureRunCasperTests() {
                this.test.renderResults(true);
            });
        };
        Conjure.prototype.status = function(source, type, meta) {
            meta = meta || {};
            Object.keys(meta).forEach(function(key) {
                try {
                    JSON.stringify(meta[key]);
                } catch (e) {
                    meta[key] = {
                        conjureJsonStringifyErr: e.message
                    };
                }
            });
            console.log(this.utils.format("conjure_status:%s", JSON.stringify({
                source: source,
                type: type,
                meta: meta
            })));
        };
        Conjure.prototype.trace = function(source, meta) {
            this.status(source, "trace", meta);
        };
        var helpers = {};
        helpers.click = function(sel, nativeClick) {
            this.trace("click", {
                sel: sel,
                nativeClick: nativeClick
            });
            this.conjure.selectorExists(sel);
            if (nativeClick) {
                this.casper.thenClick(sel);
            } else {
                this.casper.thenEvaluate(function(sel) {
                    $(sel).click();
                }, sel);
            }
        };
        helpers.then = function(cb) {
            this.trace("then");
            var args = wrapFirstCallbackInConjureContext(this, arguments);
            this.casper.then.apply(this.casper, args);
        };
        helpers.thenOpen = function() {
            var args = wrapFirstCallbackInConjureContext(this, arguments);
            this.trace("thenOpen", args[0]);
            this.casper.thenOpen.apply(this.casper, args);
        };
        helpers.assertSelText = function(sel, text) {
            var self = this;
            var is = require("is");
            this.trace("assertSelText", {
                sel: sel,
                text: text
            });
            this.casper.then(function conjureHelperAssertSelText() {
                self.trace("assertSelText", {
                    step: "then"
                });
                this.test["assert" + (is.string(text) ? "Equals" : "Match")](this.evaluate(function(sel) {
                    return $(sel).text();
                }, sel), text);
            });
        };
        helpers.assertType = function(val, expected, subject) {
            var self = this;
            this.trace("assertType", {
                val: val,
                expected: expected,
                subject: subject
            });
            this.conjure.then(function conjureHelperAssertType() {
                self.trace("assertType", {
                    step: "then"
                });
                this.test.assertEquals(this.utils.betterTypeOf(val), expected, this.utils.format("%s should be a %s", subject || "subject", expected));
            });
        };
        helpers.each = function(list, cb) {
            var self = this;
            this.trace("each", {
                list: list
            });
            list.forEach(function(item) {
                self.trace("each", {
                    item: item
                });
                self.conjure.then(function conjureHelperEach() {
                    cb.call(this, item);
                });
            });
        };
        helpers.openHash = function(hash, sel) {
            this.trace("openHash", {
                hash: hash,
                sel: sel
            });
            this.casper.thenEvaluate(function _openHash(hash) {
                window.location.hash = "#" + hash;
            }, hash);
            if (sel) {
                this.conjure.selectorExists(sel);
            }
        };
        helpers.openInitUrl = function() {
            var url = this.url(this.get("initPath"));
            this.trace("openInitUrl", {
                url: url
            });
            this.casper.thenOpen(url);
        };
        helpers.require = function(name) {
            var require = this.get("requireCasper");
            var relPathRe = /^\.\//;
            if (relPathRe.test(name)) {
                var fullPath = this.get("cli").options.rootdir + "/" + name.replace(relPathRe, "");
                this.trace("require", {
                    name: name,
                    fullPath: fullPath
                });
                return require(fullPath);
            }
            return require(name);
        };
        helpers.selectorExists = function(sel, negate) {
            var self = this;
            this.trace("selectorExists", {
                sel: sel,
                negate: negate
            });
            this.casper.waitFor(function selectorExistsWaitFor() {
                self.trace("selectorExists", {
                    step: "waitFor"
                });
                return this.evaluate(function selectorExistsEvaluate(sel, count) {
                    return count === $(sel).length;
                }, sel, negate ? 0 : 1);
            });
            this.casper.then(function selectorExistsThen() {
                self.trace("selectorExists", {
                    step: "then"
                });
                this.test.assertTrue(true, (negate ? "missing" : "exists") + ": " + sel);
            });
        };
        helpers.selectorMissing = function(sel) {
            this.trace("selectorMissing", {
                sel: sel
            });
            this.conjure.selectorExists(sel, true);
        };
        helpers.sendKeys = function(sel, keys) {
            var self = this;
            this.trace("sendKeys", {
                sel: sel,
                keys: keys
            });
            this.conjure.selectorExists(sel);
            this.conjure.then(function conjureHelperSendKeys() {
                self.trace("sendKeys", {
                    step: "then"
                });
                this.casper.sendKeys(sel, keys);
            });
        };
        helpers.url = function(relUrl) {
            return this.get("baseUrl") + relUrl;
        };
        function wrapFirstCallbackInConjureContext(self, args) {
            var extend = require("extend");
            var contextKeys = [ "utils", "colorizer", "conjure" ];
            var context = Conjure.createContext(self, contextKeys);
            args = [].slice.call(args);
            var cb;
            var cbIdx;
            args.forEach(function(val, idx) {
                if (typeof val === "function") {
                    cb = val;
                    cbIdx = idx;
                }
            });
            if (cb) {
                args[cbIdx] = function conjureHelperThenOpen() {
                    cb.call(extend(context, {
                        casper: self.casper,
                        test: this.test
                    }));
                };
            }
            return args;
        }
    });
    require.alias("codeactual-extend/index.js", "conjure/deps/extend/index.js");
    require.alias("codeactual-is/index.js", "conjure/deps/is/index.js");
    require.alias("manuelstofer-each/index.js", "codeactual-is/deps/each/index.js");
    require.alias("component-bind/index.js", "conjure/deps/bind/index.js");
    require.alias("component-each/index.js", "conjure/deps/each/index.js");
    require.alias("component-type/index.js", "component-each/deps/type/index.js");
    require.alias("visionmedia-batch/index.js", "conjure/deps/batch/index.js");
    require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
    require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");
    require.alias("visionmedia-configurable.js/index.js", "conjure/deps/configurable.js/index.js");
    require.alias("bdd-flow/lib/bdd-flow/index.js", "conjure/deps/bdd-flow/lib/bdd-flow/index.js");
    require.alias("bdd-flow/lib/bdd-flow/index.js", "conjure/deps/bdd-flow/index.js");
    require.alias("visionmedia-configurable.js/index.js", "bdd-flow/deps/configurable.js/index.js");
    require.alias("codeactual-extend/index.js", "bdd-flow/deps/extend/index.js");
    require.alias("visionmedia-batch/index.js", "bdd-flow/deps/batch/index.js");
    require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
    require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");
    require.alias("component-clone/index.js", "bdd-flow/deps/clone/index.js");
    require.alias("component-type/index.js", "component-clone/deps/type/index.js");
    require.alias("bdd-flow/lib/bdd-flow/index.js", "bdd-flow/index.js");
    require.alias("enumerable-prop/lib/enumerable-prop/index.js", "conjure/deps/enumerable-prop/lib/enumerable-prop/index.js");
    require.alias("enumerable-prop/lib/enumerable-prop/index.js", "conjure/deps/enumerable-prop/index.js");
    require.alias("component-enumerable/index.js", "enumerable-prop/deps/enumerable/index.js");
    require.alias("component-to-function/index.js", "component-enumerable/deps/to-function/index.js");
    require.alias("enumerable-prop/lib/enumerable-prop/index.js", "enumerable-prop/index.js");
    require.alias("conjure/lib/conjure/index.js", "conjure/index.js");
    if (typeof exports == "object") {
        module.exports = require("conjure");
    } else if (typeof define == "function" && define.amd) {
        define(function() {
            return require("conjure");
        });
    } else {
        window["conjure"] = require("conjure");
    }
})();