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
    require.register("codeactual-outer-shelljs/index.js", function(exports, require, module) {
        "use strict";
        module.exports = {
            OuterShelljs: OuterShelljs,
            create: create,
            require: require
        };
        var emitter = require("emitter");
        function OuterShelljs(shelljs) {
            this.shelljs = shelljs;
        }
        emitter(OuterShelljs.prototype);
        OuterShelljs.prototype.findByRegex = function(parent, regex) {
            return this._("find", parent).filter(function(file) {
                return file.match(regex);
            });
        };
        OuterShelljs.prototype._ = function(method) {
            var args = [].slice.call(arguments, 1);
            var res = this.shelljs[method].apply(this.shelljs, args);
            var eventArgs = [ "cmd", method, args, res ];
            this.emit.apply(this, eventArgs);
            eventArgs = [ "cmd:" + method, args, res ];
            this.emit.apply(this, eventArgs);
            return res;
        };
        function create(shelljs) {
            return new OuterShelljs(shelljs);
        }
    });
    require.register("parapsych/index.js", function(exports, require, module) {
        "use strict";
        module.exports = {
            Parapsych: Parapsych,
            TestContext: TestContext,
            create: create,
            require: require
        };
        var bind = require("bind");
        var configurable = require("configurable.js");
        var each = require("each");
        var is = require("is");
        var sprintf;
        var shelljs;
        var defShellOpt = {
            silent: true
        };
        function create(require) {
            var testContext = new TestContext();
            var p = new Parapsych(testContext);
            p.set("nativeRequire", require);
            window.casper = testContext.casper;
            window.describe = bind(testContext, testContext.describe);
            window.it = bind(testContext, testContext.it);
            return p;
        }
        function Parapsych(testContext) {
            this.testContext = testContext;
        }
        Parapsych.prototype.set = function() {
            this.testContext.set.apply(this.testContext, arguments);
            return this;
        };
        Parapsych.prototype.get = function() {
            return this.testContext.get.apply(this.testContext, arguments);
        };
        Parapsych.prototype.done = function() {
            return this.testContext.done();
        };
        function TestContext() {
            this.settings = {
                started: false,
                initSel: "body",
                baseSel: "",
                nativeRequire: {},
                rootDir: "",
                serverProto: "http",
                serverHost: "localhost",
                serverPort: "8174",
                grep: /.?/,
                cli: {}
            };
            this.depth = [];
        }
        configurable(TestContext.prototype);
        TestContext.prototype.start = function(desc, cb) {
            this.set("started", true);
            var self = this;
            var cli = this.get("cli");
            if (cli.options.grep) {
                this.set("grep", new RegExp(cli.args.join(" ")));
            }
            this.casper = this.get("nativeRequire")("casper").create({
                exitOnError: true,
                logLevel: "debug",
                pageSettings: {
                    loadImages: false,
                    loadPlugins: false,
                    XSSAuditingEnabled: true,
                    verbose: true,
                    onError: function(self, m) {
                        console.error("FATAL error:" + m);
                        self.exit();
                    },
                    onLoadError: function(self, m) {
                        console.error("FATAL load error:" + m);
                        self.exit();
                    }
                }
            });
            var baseSel = this.get("baseSel");
            var initSel = this.get("initSel");
            var initUrl = this.get("initUrl");
            this.casper.test.info("INIT URL: " + initUrl);
            if (baseSel) {
                this.casper.test.info("INIT SELECTOR: " + baseSel);
            }
            this.casper.test.info("  " + desc);
            this.depth.push(desc);
            this.casper.start(this.url(initUrl));
            this.casper.then(function(response) {
                self.response = response;
                self.casper.waitForSelector(initSel);
            });
            this.casper.then(cb);
        };
        TestContext.prototype.url = function(relUrl) {
            return this.get("serverProto") + "://" + this.get("serverHost") + ":" + this.get("serverPort") + relUrl;
        };
        TestContext.prototype.openInitUrl = function() {
            this.casper.thenOpen(this.url(this.get("initUrl")));
        };
        TestContext.prototype.done = function() {
            this.casper.run(function() {
                this.test.renderResults(true);
            });
        };
        TestContext.prototype.selectorExists = function(sel, negate) {
            var self = this;
            this.casper.waitFor(function selectorExistsWaitFor() {
                return this.evaluate(function selectorExistsEvaluate(sel, count) {
                    return count === $(sel).length;
                }, sel, negate ? 0 : 1);
            });
            this.casper.then(function selectorExistsThen() {
                this.test.assertTrue(true, (negate ? "missing" : "exists") + ": " + sel);
            });
        };
        TestContext.prototype.selectorMissing = function(sel) {
            this.selectorExists(sel, true);
        };
        TestContext.prototype.andClick = function(sel) {
            this.selectorExists(sel);
            this.casper.thenEvaluate(function(sel) {
                $(sel).click();
            }, sel);
        };
        TestContext.prototype.forEach = function(list, cb) {
            var self = this;
            this.casper.each(list, function(__self, item) {
                cb.apply(self, [].slice.call(arguments, 1));
            });
        };
        TestContext.prototype.describe = function(desc, cb) {
            var self = this;
            if (this.get("started")) {
                this.casper.then(function() {
                    self.casper.test.info("  " + desc);
                    self.depth.push(desc);
                    cb.call(self);
                });
                this.casper.then(function() {
                    self.depth.pop();
                });
            } else {
                this.start(desc, cb);
            }
        };
        TestContext.prototype.it = function(desc, cb, wrap) {
            var self = this;
            var depth = this.depth.concat(desc);
            if (!this.get("grep").test(depth.join(" "))) {
                return;
            }
            this.casper.then(function() {
                self.casper.test.info("    " + desc);
                self.depth = depth;
            });
            if (wrap || typeof wrap === "undefined") {
                this.andThen(cb);
            } else {
                cb.call(this);
            }
            this.casper.then(function() {
                self.depth.pop();
            });
        };
        TestContext.prototype.openHash = function(hash, sel) {
            this.casper.thenEvaluate(function _openHash(hash) {
                window.location.hash = "#" + hash;
            }, hash);
            if (sel) {
                this.selectorExists(sel);
            }
        };
        TestContext.prototype.andThen = function(cb) {
            var self = this;
            this.casper.then(function() {
                var then = this;
                var keys = Object.keys(self).concat(Object.keys(TestContext.prototype));
                each(keys, function(key) {
                    if (typeof self[key] === "undefined") {
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
        TestContext.prototype.thenSendKeys = function(sel, content) {
            this.selectorExists(sel);
            this.andThen(function() {
                this.sendKeys(sel, content);
            });
        };
        TestContext.prototype.assertSelText = function(sel, text, message) {
            this.casper.then(function() {
                this.test["assert" + (is.string(text) ? "Equals" : "Match")](this.evaluate(function(sel) {
                    return $(sel).text();
                }, sel), text);
            });
        };
    });
    require.alias("visionmedia-configurable.js/index.js", "parapsych/deps/configurable.js/index.js");
    require.alias("component-bind/index.js", "parapsych/deps/bind/index.js");
    require.alias("codeactual-is/index.js", "parapsych/deps/is/index.js");
    require.alias("manuelstofer-each/index.js", "codeactual-is/deps/each/index.js");
    require.alias("component-each/index.js", "parapsych/deps/each/index.js");
    require.alias("component-type/index.js", "component-each/deps/type/index.js");
    require.alias("visionmedia-batch/index.js", "parapsych/deps/batch/index.js");
    require.alias("component-emitter/index.js", "visionmedia-batch/deps/emitter/index.js");
    require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");
    require.alias("codeactual-outer-shelljs/index.js", "parapsych/deps/outer-shelljs/index.js");
    require.alias("component-emitter/index.js", "codeactual-outer-shelljs/deps/emitter/index.js");
    require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");
    if (typeof exports == "object") {
        module.exports = require("parapsych");
    } else if (typeof define == "function" && define.amd) {
        define(function() {
            return require("parapsych");
        });
    } else {
        window["parapsych"] = require("parapsych");
    }
})();