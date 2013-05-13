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
    require.register("codeactual-enumerable-prop/lib/enumerable-prop/index.js", function(exports, require, module) {
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
    require.register("component-emitter/index.js", function(exports, require, module) {
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
            var i = callbacks.indexOf(fn._off || fn);
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
    require.register("codeactual-weir/lib/weir/index.js", function(exports, require, module) {
        "use strict";
        exports.Weir = Weir;
        exports.create = function() {
            return new Weir();
        };
        exports.extend = function(ext) {
            return extend(Weir.prototype, ext);
        };
        exports.requireComponent = require;
        var Batch = require("batch");
        var bind = require("bind");
        var clone = require("clone");
        var configurable = require("configurable.js");
        var emitter = require("emitter");
        var extend = require("extend");
        var flowFnRegex = /^(it|describe|before|beforeEach|after|afterEach)$/;
        var defOmitContextRegex = {
            all: [ /^__conjure__/ ],
            describe: [],
            hook: [ flowFnRegex ],
            it: [ flowFnRegex ],
            rootDescribe: []
        };
        function Weir() {
            this.settings = {
                done: weirNoOp,
                itWrap: null,
                describeWrap: null,
                omitContextRegex: clone(defOmitContextRegex),
                path: [],
                grep: /.?/,
                grepv: null,
                sharedContext: {},
                stats: {
                    depth: 0
                },
                emit: bind(this, this.emit)
            };
            this.rootDescribes = [];
            this.batch = new Batch();
            this.seedProps = {};
        }
        Weir.describeConfigKeys = [ "describeWrap", "emit", "itWrap", "omitContextRegex", "path", "grep", "grepv", "sharedContext", "stats" ];
        configurable(Weir.prototype);
        emitter(Weir.prototype);
        Weir.prototype.addContextProp = function(key, val) {
            this.seedProps[key] = val;
            return this;
        };
        Weir.prototype.addRootDescribe = function(name, cb) {
            var self = this;
            var desc = new Describe(name);
            desc.describe(name, cb);
            this.rootDescribes.push(desc);
            return this;
        };
        Weir.prototype.currentDepth = function() {
            return this.get("stats").depth;
        };
        Weir.prototype.hideContextProp = function(type, regex) {
            if (typeof regex === "string") {
                regex = new RegExp("^" + regex + "$");
            }
            this.get("omitContextRegex")[type].push(regex);
            return this;
        };
        Weir.prototype.run = function() {
            var self = this;
            var batch = new Batch();
            batch.concurrency(1);
            this.set("sharedContext", this.seedProps);
            this.rootDescribes.forEach(function weirEachRootDescribe(desc) {
                batch.push(function weirBatchPushRootDescribe(taskDone) {
                    self.set("path", []);
                    Weir.describeConfigKeys.forEach(function weirForEachConfigKey(key) {
                        desc.set(key, self.get(key));
                    });
                    weirRunStepsInBatch(desc.steps, taskDone);
                });
            });
            batch.end(this.get("done"));
        };
        Weir.defaultHookImpl = function(done) {
            done();
        };
        function HookSet() {
            this.before = Weir.defaultHookImpl;
            this.beforeEach = Weir.defaultHookImpl;
            this.after = Weir.defaultHookImpl;
            this.afterEach = Weir.defaultHookImpl;
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
        Describe.copyConfig = function(src, dest) {
            Weir.describeConfigKeys.forEach(function weirDescribeCopyConfigIter(key) {
                dest.set(key, src.get(key));
            });
        };
        Describe.prototype.createStep = function(name, cb) {
            var self = this;
            return function(taskDone) {
                var desc = new Describe(name);
                Describe.copyConfig(self, desc);
                desc.runStep(name, cb);
                var batch = new Batch();
                batch.concurrency(1);
                batch.push(bind(desc, desc.beforeTask));
                batch.push(function weirRunNestedDescribeSteps(done) {
                    desc.steps = desc.steps.map(bind(desc, desc.prepareSteps));
                    weirRunStepsInBatch(desc.steps, done);
                });
                batch.push(bind(desc, desc.afterTask));
                batch.end(function weirEndDescribeBatch() {
                    desc.popStep();
                    taskDone();
                });
            };
        };
        Describe.prototype.extendSharedContext = function(ext, type) {
            return extend(this.get("sharedContext"), this.filterProps(ext, type));
        };
        Describe.prototype.filterProps = function(obj, type) {
            var omitContextRegex = this.get("omitContextRegex");
            var regex = omitContextRegex.all.concat(omitContextRegex[type]);
            return Object.keys(obj).reduce(function weirReduceFilterProps(memo, key) {
                var omit = false;
                regex.forEach(function weirForEachFilterPropsRegex(re) {
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
        Describe.prototype.prepareSteps = function(step) {
            var self = this;
            var path = this.get("path");
            if (step instanceof DescribeCallback) {
                var context = this.getSharedContext("describe");
                return new DescribeCallback(step.name, bind(context, step.cb));
            }
            var itPath = path.concat(step.name);
            var grep = this.get("grep");
            var grepv = this.get("grepv");
            if (grepv) {
                if (grepv.test(itPath.join(" "))) {
                    return new ItCallback(step.name, weirBatchNoOp);
                }
            } else if (grep) {
                if (!grep.test(itPath.join(" "))) {
                    return new ItCallback(step.name, weirBatchNoOp);
                }
            }
            return new ItCallback(step.name, function weirItCallback(done) {
                var batch = new Batch();
                batch.push(bind(self, self.beforeEachTask));
                batch.push(bind(self, self.itTask, step, itPath));
                batch.push(bind(self, self.afterEachTask));
                batch.concurrency(1);
                batch.end(done);
            });
        };
        Describe.prototype.runStep = function(name, cb) {
            var self = this;
            var path = this.get("path");
            path.push(name);
            var describeWrap = this.get("describeWrap") || weirDefDescribeWrap;
            describeWrap(name, function weirDescribeWrap() {
                var wrapContext = this || {};
                var mergedContext = self.extendSharedContext(wrapContext, "describe");
                mergedContext.describe = bind(self, self.describe);
                mergedContext.it = bind(self, self.it);
                mergedContext.before = bind(self, self.before);
                mergedContext.beforeEach = bind(self, self.beforeEach);
                mergedContext.after = bind(self, self.after);
                mergedContext.afterEach = bind(self, self.afterEach);
                weirAddInternalProp(mergedContext, "name", name);
                cb.call(mergedContext);
                self.pushStep();
            });
        };
        Describe.prototype.it = function(name, cb) {
            this.steps.push(new ItCallback(name, cb));
        };
        Describe.prototype.describe = function(name, cb) {
            this.steps.push(new DescribeCallback(name, this.createStep(name, cb)));
        };
        Describe.prototype.before = function(cb) {
            this.hooks.before = cb;
        };
        Describe.prototype.beforeTask = function(taskDone) {
            var self = this;
            var hook = this.hooks.before;
            var context = this.getSharedContext("hook");
            function weirBeforeDone() {
                self.extendSharedContext(context, "hook");
                taskDone();
            }
            if (hook.length) {
                this.hooks.before.call(context, weirBeforeDone);
            } else {
                this.hooks.before.call(context);
                weirBeforeDone();
            }
        };
        Describe.prototype.beforeEach = function(cb) {
            this.hooks.beforeEach = cb;
        };
        Describe.prototype.beforeEachTask = function(taskDone) {
            var self = this;
            var hook = this.hooks.beforeEach;
            var context = this.getSharedContext("hook");
            function weirBeforeEachDone() {
                self.extendSharedContext(context, "hook");
                taskDone();
            }
            if (hook.length) {
                this.hooks.beforeEach.call(context, weirBeforeEachDone);
            } else {
                this.hooks.beforeEach.call(context);
                weirBeforeEachDone();
            }
        };
        Describe.prototype.after = function(cb) {
            this.hooks.after = cb;
        };
        Describe.prototype.afterTask = function(taskDone) {
            var self = this;
            var hook = this.hooks.after;
            var context = this.getSharedContext("hook");
            function weirAfterDone() {
                self.extendSharedContext(context, "hook");
                taskDone();
            }
            if (hook.length) {
                this.hooks.after.call(context, weirAfterDone);
            } else {
                this.hooks.after.call(context);
                weirAfterDone();
            }
        };
        Describe.prototype.afterEach = function(cb) {
            this.hooks.afterEach = cb;
        };
        Describe.prototype.afterEachTask = function(taskDone) {
            var self = this;
            var hook = this.hooks.afterEach;
            var context = this.getSharedContext("hook");
            function weirAfterEachDone() {
                self.extendSharedContext(context, "hook");
                taskDone();
            }
            if (hook.length) {
                this.hooks.afterEach.call(context, weirAfterEachDone);
            } else {
                this.hooks.afterEach.call(context);
                weirAfterEachDone();
            }
        };
        Describe.prototype.itTask = function(step, path, taskDone) {
            var self = this;
            var context = this.getSharedContext("it");
            var emit = this.get("emit");
            var itWrap = this.get("itWrap") || weirDefItWrap;
            function weirItDone() {
                self.extendSharedContext(context, "it");
                emit("itPop", step.name);
                taskDone();
            }
            if (itWrap.length == 3) {
                itWrap(step.name, function weirItWrapAsync() {
                    var wrapContext = this || {};
                    extend(context, wrapContext);
                    weirAddInternalProp(context, "name", step.name, true);
                    weirAddInternalProp(context, "path", path, true);
                    emit("itPush", step.name);
                    step.cb.call(context);
                }, weirItDone);
            } else {
                itWrap(step.name, function weirItWrap() {
                    var wrapContext = this || {};
                    extend(context, wrapContext);
                    weirAddInternalProp(context, "name", step.name, true);
                    weirAddInternalProp(context, "path", path, true);
                    emit("itPush", step.name);
                    if (step.cb.length) {
                        step.cb.call(context, weirItDone);
                    } else {
                        step.cb.call(context);
                        weirItDone();
                    }
                });
            }
        };
        Describe.prototype.pushStep = function() {
            var emit = this.get("emit");
            var stats = this.get("stats");
            stats.depth++;
            this.set("stats", stats);
            emit("describePush", this.name);
        };
        Describe.prototype.popStep = function() {
            var emit = this.get("emit");
            var stats = this.get("stats");
            stats.depth--;
            this.set("stats", stats);
            emit("describePop", this.name);
        };
        function DescribeCallback(name, cb) {
            this.name = name;
            this.cb = cb;
        }
        function weirRunStepsInBatch(steps, cb) {
            var batch = new Batch();
            batch.concurrency(1);
            steps.forEach(function weirForEachStep(step) {
                batch.push(step.cb);
            });
            batch.end(cb);
        }
        function weirNoOp() {}
        function weirBatchNoOp(taskDone) {
            taskDone();
        }
        function weirDefItWrap(name, cb) {
            cb();
        }
        function weirDefDescribeWrap(name, cb) {
            cb();
        }
        function weirDelInternalProp(obj, key) {
            delete obj["__conjure__" + key];
        }
        function weirAddInternalProp(obj, key, val, writable) {
            Object.defineProperty(obj, "__conjure__" + key, {
                value: val,
                enumerable: false,
                configurable: true,
                writable: !!writable
            });
        }
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
    require.register("conjure/lib/conjure/index.js", function(exports, require, module) {
        "use strict";
        exports.Conjure = Conjure;
        exports.create = function(requireCasper) {
            return new Conjure(requireCasper);
        };
        exports.extendConjure = function(ext) {
            return require("extend")(Conjure.prototype, ext);
        };
        exports.extendAsyncHelpers = function(ext) {
            return require("extend")(helpers.async, ext);
        };
        exports.extendSyncHelpers = function(ext) {
            return require("extend")(helpers.sync, ext);
        };
        exports.requireComponent = require;
        exports.setRequire = function(stub) {
            require = stub;
        };
        var requireComponent = require;
        var bddflow = require("weir");
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
            this.casper = null;
            this.conjure = {};
            this.flow = bddflow.create();
            this.running = false;
            this.stackDepth = 0;
            this.url = bind(this, helpers.sync.url);
            this.require = bind(this, helpers.sync.require);
            this.utils = this.require("utils");
            this.colorizer = this.require("colorizer").create("Colorizer");
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
            this.injectHelpers();
            this.configureBddflow(name, cb);
            this.casper.start(this.url(this.get("initPath")));
            this.run();
        };
        Conjure.prototype.configureBddflow = function(name, cb) {
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
            this.flow.set("itWrap", function conjureItWrap(name, cb, done) {
                self.casper.then(function conjureItWrapThen() {
                    self.set("test", this.test);
                    cb.call(this);
                });
                self.casper.then(function conjureItWrapDoneThen() {
                    done();
                });
            });
            this.flow.set("describeWrap", function conjureDescribeWrap(name, cb) {
                var contextKeys = [ "casper", "utils", "colorizer", "conjure" ];
                cb.call(Conjure.createContext(self, contextKeys));
            });
            this.flow.on("describePush", function conjureOnDescribePush(name) {
                self.pushStatus("describe", "trace", {
                    name: name
                });
            });
            this.flow.on("describePop", function conjureOnDescribePop(name) {
                self.popStatus();
            });
            this.flow.on("itPush", function conjureOnItPush(name) {
                self.pushStatus("it", "trace", {
                    name: name
                });
            });
            this.flow.on("itPop", function conjureOnItPop(name) {
                self.set("test", null);
                self.popStatus();
            });
            this.flow.addRootDescribe("initial selector", function conjureRootDescribe() {
                this.it("should match", function conjureInitSelectorShouldExist() {
                    this.conjure.selectorExists(self.get("initSel"));
                });
            });
            this.flow.addRootDescribe(name, cb);
            this.casper.on("step.complete", function() {
                if (typeof this.steps[this.step] === "function" && this.steps[this.step].__conjure_helper_last_step) {
                    self.popStatus();
                }
            });
        };
        Conjure.prototype.injectHelpers = function() {
            var self = this;
            var bind = requireComponent("bind");
            Object.keys(helpers.async).forEach(bind(this, this.bindAsyncHelper));
            Object.keys(helpers.sync).forEach(function(key) {
                self.conjure[key] = bind(self, helpers.sync[key]);
            });
        };
        Conjure.prototype.bindAsyncHelper = function(name) {
            var self = this;
            var extend = requireComponent("extend");
            this.conjure[name] = function conjureInjectHelperWrap() {
                var args = arguments;
                var hasPendingStep = false;
                self.pushStatus(name, "trace");
                var lastStep = function(cb) {
                    hasPendingStep = true;
                    return conjureTagLastStep(cb);
                };
                var context = extend({}, self, {
                    lastStep: lastStep
                });
                var result = helpers.async[name].apply(context, args);
                if (!hasPendingStep) {
                    self.popStatus();
                }
                return result;
            };
        };
        Conjure.prototype.run = function() {
            var self = this;
            var initSel = this.get("initSel");
            var initPath = this.get("initPath");
            this.trace("config", {
                initPath: initPath,
                initSel: initSel || "<none>"
            });
            this.running = true;
            this.flow.run();
            this.casper.run(function conjureRunCasperTests() {
                this.test.renderResults(true);
            });
        };
        Conjure.prototype.status = function(source, type, meta) {
            meta = meta || {};
            Object.keys(meta).forEach(function conjureForEachStatusMetaKey(key) {
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
                meta: meta,
                depth: this.stackDepth
            })));
        };
        Conjure.prototype.popStatus = function() {
            this.stackDepth--;
        };
        Conjure.prototype.pushStatus = function(source, type, meta) {
            this.status(source, type, meta);
            this.stackDepth++;
        };
        Conjure.prototype.trace = function(source, meta) {
            this.status(source, "trace", meta);
        };
        var helpers = {
            async: {},
            sync: {}
        };
        helpers.async.click = function(sel, nativeClick) {
            var self = this;
            this.trace("args", {
                sel: sel,
                nativeClick: nativeClick
            });
            this.conjure.selectorExists(sel, false, false);
            if (nativeClick) {
                this.casper.thenClick(sel, this.lastStep(conjureNoOp));
            } else {
                this.casper.then(this.lastStep(function conjureHelperClickThenEvalThen() {
                    self.casper.thenEvaluate(function conjureHelperClickThenEval(sel) {
                        $(sel).click();
                    }, sel);
                }));
            }
        };
        helpers.async.then = function(lastStep) {
            lastStep = typeof lastStep === "undefined" ? true : lastStep;
            var args = conjureWrapFirstCallbackInConjureContext(this, arguments, lastStep);
            this.casper.then.apply(this.casper, args);
        };
        helpers.async.thenOpen = function() {
            var self = this;
            var args = conjureWrapFirstCallbackInConjureContext(this, arguments, true);
            args[0] = /^https?:\/\//.test(args[0]) ? args[0] : this.url(args[0]);
            this.trace("args", {
                url: args[0]
            });
            this.casper.then(this.lastStep(function conjureThenOpenThen() {
                self.casper.thenOpen.apply(self.casper, args);
            }));
        };
        helpers.async.assertSelText = function(sel, text) {
            var self = this;
            var is = require("is");
            this.trace("args", {
                sel: sel,
                text: text.toString()
            });
            this.casper.then(this.lastStep(function conjureHelperAssertSelText() {
                self.trace("closure", {
                    type: "then"
                });
                this.test["assert" + (is.string(text) ? "Equals" : "Match")](this.evaluate(function conjureHelperAssertSelTextEval(sel) {
                    return $(sel).text();
                }, sel), text);
            }));
        };
        helpers.async.each = function(list, cb) {
            var self = this;
            var length = list.length;
            this.trace("args", {
                list: list
            });
            list.forEach(function conjureHelperEachIter(item, idx) {
                self.trace("closure", {
                    type: "forEach",
                    item: item
                });
                var cbWrap = function conjureHelperEachThen() {
                    cb.call(this, item, idx, list);
                };
                self.conjure.then(cbWrap, idx === length - 1);
            });
        };
        helpers.async.openHash = function(hash, sel) {
            var self = this;
            this.trace("args", {
                hash: hash,
                sel: sel
            });
            var cb = function conjureOpenHashThenEval(hash) {
                window.location.hash = "#" + hash;
            };
            if (sel) {
                this.casper.thenEvaluate(cb, hash);
                this.conjure.selectorExists(sel);
            } else {
                this.casper.then(this.lastStep(function conjureOpenHashThen() {
                    self.casper.thenEvaluate(cb, hash);
                }));
            }
        };
        helpers.async.openInitUrl = function() {
            var url = this.url(this.get("initPath"));
            this.trace("args", {
                url: url
            });
            this.casper.thenOpen(url);
        };
        helpers.async.selectorExists = function(sel, negate, lastStep) {
            var self = this;
            lastStep = typeof lastStep === "undefined" ? true : lastStep;
            this.trace("args", {
                sel: sel,
                negate: negate
            });
            this.casper.waitFor(function selectorExistsWaitFor() {
                self.trace("closure", {
                    type: "waitFor"
                });
                return this.evaluate(function selectorExistsEvaluate(sel, count) {
                    return count === $(sel).length;
                }, sel, negate ? 0 : 1);
            });
            var thenWrap = lastStep ? this.lastStep : conjureReturnFirstArg;
            this.casper.then(thenWrap(function selectorExistsThen() {
                self.trace("closure", {
                    type: "then"
                });
                this.test.assertTrue(true, (negate ? "missing" : "exists") + ": " + sel);
            }));
        };
        helpers.async.selectorMissing = function(sel, lastStep) {
            lastStep = typeof lastStep === "undefined" ? true : lastStep;
            this.trace("args", {
                sel: sel
            });
            this.conjure.selectorExists(sel, true, lastStep);
        };
        helpers.async.sendKeys = function(sel, keys) {
            var self = this;
            this.trace("args", {
                sel: sel,
                keys: keys
            });
            this.conjure.selectorExists(sel, false, false);
            this.casper.then(this.lastStep(function conjureHelperSendKeys() {
                self.trace("closure", {
                    type: "send keys last then"
                });
                self.casper.sendKeys(sel, keys);
            }));
        };
        helpers.sync.assertType = function(val, expected, subject) {
            var self = this;
            this.trace("args", {
                val: val,
                expected: expected,
                subject: subject
            });
            this.get("test").assertEquals(this.utils.betterTypeOf(val), expected, this.utils.format("%s should be a %s", subject || "subject", expected));
        };
        helpers.sync.require = function(name) {
            var require = this.get("requireCasper");
            var relPathRe = /^\.\//;
            if (relPathRe.test(name)) {
                var fullPath = this.get("cli").options.rootdir + "/" + name.replace(relPathRe, "");
                this.trace("args", {
                    name: name,
                    fullPath: fullPath
                });
                return require(fullPath);
            }
            return require(name);
        };
        helpers.sync.url = function(relUrl) {
            return this.get("baseUrl") + (relUrl[0] === "/" ? relUrl : "/" + relUrl);
        };
        function conjureWrapFirstCallbackInConjureContext(self, args, last) {
            var extend = require("extend");
            var contextKeys = [ "utils", "colorizer", "conjure" ];
            var context = Conjure.createContext(self, contextKeys);
            args = [].slice.call(args);
            var cb;
            var cbIdx;
            args.forEach(function conjureFindFirstCallbackArg(val, idx) {
                if (typeof val === "function") {
                    cb = val;
                    cbIdx = idx;
                }
            });
            if (cb) {
                args[cbIdx] = function conjureHelperThenOpen() {
                    var test = this.test.assertEquals ? this.test : self.get("test");
                    cb.call(extend(context, {
                        casper: self.casper,
                        test: test
                    }));
                };
                if (last) {
                    args[cbIdx] = self.lastStep(args[cbIdx]);
                }
            }
            return args;
        }
        function conjureTagLastStep(cb) {
            cb.__conjure_helper_last_step = true;
            return cb;
        }
        function conjureNoOp() {}
        function conjureReturnFirstArg(arg) {
            return arg;
        }
    });
    require.alias("codeactual-enumerable-prop/lib/enumerable-prop/index.js", "conjure/deps/enumerable-prop/lib/enumerable-prop/index.js");
    require.alias("codeactual-enumerable-prop/lib/enumerable-prop/index.js", "conjure/deps/enumerable-prop/index.js");
    require.alias("component-enumerable/index.js", "codeactual-enumerable-prop/deps/enumerable/index.js");
    require.alias("component-to-function/index.js", "component-enumerable/deps/to-function/index.js");
    require.alias("codeactual-enumerable-prop/lib/enumerable-prop/index.js", "codeactual-enumerable-prop/index.js");
    require.alias("codeactual-extend/index.js", "conjure/deps/extend/index.js");
    require.alias("codeactual-is/index.js", "conjure/deps/is/index.js");
    require.alias("manuelstofer-each/index.js", "codeactual-is/deps/each/index.js");
    require.alias("codeactual-weir/lib/weir/index.js", "conjure/deps/weir/lib/weir/index.js");
    require.alias("codeactual-weir/lib/weir/index.js", "conjure/deps/weir/index.js");
    require.alias("visionmedia-configurable.js/index.js", "codeactual-weir/deps/configurable.js/index.js");
    require.alias("codeactual-extend/index.js", "codeactual-weir/deps/extend/index.js");
    require.alias("visionmedia-batch/index.js", "codeactual-weir/deps/batch/index.js");
    require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
    require.alias("component-clone/index.js", "codeactual-weir/deps/clone/index.js");
    require.alias("component-type/index.js", "component-clone/deps/type/index.js");
    require.alias("component-emitter/index.js", "codeactual-weir/deps/emitter/index.js");
    require.alias("component-bind/index.js", "codeactual-weir/deps/bind/index.js");
    require.alias("codeactual-weir/lib/weir/index.js", "codeactual-weir/index.js");
    require.alias("component-bind/index.js", "conjure/deps/bind/index.js");
    require.alias("component-each/index.js", "conjure/deps/each/index.js");
    require.alias("component-type/index.js", "component-each/deps/type/index.js");
    require.alias("visionmedia-batch/index.js", "conjure/deps/batch/index.js");
    require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
    require.alias("visionmedia-configurable.js/index.js", "conjure/deps/configurable.js/index.js");
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