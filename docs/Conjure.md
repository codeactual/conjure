Parallel CasperJS runner, BDD flow, module-based tests, API helpers

_Source: [lib/conjure/index.js](../lib/conjure/index.js)_

<a name="tableofcontents"></a>

- <a name="toc_exportsconjure"></a><a name="toc_exports"></a>[exports.Conjure](#exportsconjure)
- <a name="toc_exportscreaterequirecasper"></a>[exports.create](#exportscreaterequirecasper)
- <a name="toc_exportsextendconjureext"></a>[exports.extendConjure](#exportsextendconjureext)
- <a name="toc_exportsextendasynchelpersext"></a>[exports.extendAsyncHelpers](#exportsextendasynchelpersext)
- <a name="toc_exportsextendsynchelpersext"></a>[exports.extendSyncHelpers](#exportsextendsynchelpersext)
- <a name="toc_conjurerequirecasper"></a>[Conjure](#conjurerequirecasper)
- <a name="toc_conjurecreatecontextparent-pluck-omit"></a>[Conjure.createContext](#conjurecreatecontextparent-pluck-omit)
- <a name="toc_conjureprototypeisrunning"></a><a name="toc_conjureprototype"></a>[Conjure.prototype.isRunning](#conjureprototypeisrunning)
- <a name="toc_conjureprototypetestname-cb"></a>[Conjure.prototype.test](#conjureprototypetestname-cb)
- <a name="toc_conjureprototyperun"></a>[Conjure.prototype.run](#conjureprototyperun)
- <a name="toc_conjureprototypepopstatus"></a>[Conjure.prototype.popStatus](#conjureprototypepopstatus)
- <a name="toc_conjureprototypepushstatus"></a>[Conjure.prototype.pushStatus](#conjureprototypepushstatus)
- <a name="toc_helpersasyncclicksel-nativeclickfalse"></a><a name="toc_helpersasync"></a><a name="toc_helpers"></a>[helpers.async.click](#helpersasyncclicksel-nativeclickfalse)
- <a name="toc_helpersasyncthencb-laststeptrue"></a>[helpers.async.then](#helpersasyncthencb-laststeptrue)
- <a name="toc_helpersasyncthenopenargs"></a>[helpers.async.thenOpen](#helpersasyncthenopenargs)
- <a name="toc_helpersasyncassertseltextsel-text"></a>[helpers.async.assertSelText](#helpersasyncassertseltextsel-text)
- <a name="toc_helpersasynceachlist-cb"></a>[helpers.async.each](#helpersasynceachlist-cb)
- <a name="toc_helpersasyncopenhashhash-sel"></a>[helpers.async.openHash](#helpersasyncopenhashhash-sel)
- <a name="toc_helpersasyncopeniniturl"></a>[helpers.async.openInitUrl](#helpersasyncopeniniturl)
- <a name="toc_helpersasyncselectorexistssel-negate-laststeptrue"></a>[helpers.async.selectorExists](#helpersasyncselectorexistssel-negate-laststeptrue)
- <a name="toc_helpersasyncselectormissingsel-laststeptrue"></a>[helpers.async.selectorMissing](#helpersasyncselectormissingsel-laststeptrue)
- <a name="toc_helpersasyncsendkeyssel-keys"></a>[helpers.async.sendKeys](#helpersasyncsendkeyssel-keys)
- <a name="toc_helperssyncasserttypeval-expected-subjectnone"></a><a name="toc_helperssync"></a>[helpers.sync.assertType](#helperssyncasserttypeval-expected-subjectnone)
- <a name="toc_helperssyncrequirename"></a>[helpers.sync.require](#helperssyncrequirename)
- <a name="toc_helperssyncurlrelurl"></a>[helpers.sync.url](#helperssyncurlrelurl)

<a name="exports"></a>

# exports.Conjure()

> Reference to [Conjure](#conjurerequirecasper).

<sub>Go: [TOC](#tableofcontents) | [exports](#toc_exports)</sub>

# exports.create(requireCasper)

> Create a new [Conjure](#conjurerequirecasper).

**Parameters:**

- `{object} requireCasper` Casper-land `require()`

**Return:**

`{object}`

<sub>Go: [TOC](#tableofcontents) | [exports](#toc_exports)</sub>

# exports.extendConjure(ext)

> Extend [Conjure](#conjurerequirecasper).prototype.

**Parameters:**

- `{object} ext`

**Return:**

`{object}` Merge result.

<sub>Go: [TOC](#tableofcontents) | [exports](#toc_exports)</sub>

# exports.extendAsyncHelpers(ext)

> Extend the object that includes functions like `selectorExists()`.

**Parameters:**

- `{object} ext`

**Return:**

`{object}` Merge result.

<sub>Go: [TOC](#tableofcontents) | [exports](#toc_exports)</sub>

# exports.extendSyncHelpers(ext)

> Extend the object that includes functions like `url()`.

**Parameters:**

- `{object} ext`

**Return:**

`{object}` Merge result.

<sub>Go: [TOC](#tableofcontents) | [exports](#toc_exports)</sub>

# Conjure(requireCasper)

> Add BDD globals and init configuration.

**Usage:**

```js
var conjure = require('conjure').create();
conjure.set('exitOnError', false);
```

**Configuration:**

- `{string} baseUrl` Of target test server. `[http://localhost:8174]`
- `{string} initPath` Wait for this relative path to load before starting tests. `[/]`
- `{string} initSel` Wait for this selector (on `initPath`) before starting tests. `[body]`
- `{object} test` CasperJS test API of the current `it()`
- `{object} casperConfig` Native CasperJS `create()` settings.

**Default `casperConfig`:**

```js
{
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
}
```

**To modify `casperConfig`:**

- `get() + set()` from a test script.
- Or apply globally using a `--bootstrap` module.

**Properties:**

- `{object} conjure` All `helpers` functions bound to `this`.
- `{object} console` `LongCon` instance
- `{object} flow` `Bddflow` instance
- `{object} utils` Native CasperJS `utils` module
- `{object} colorizer` Native CasperJS `colorizer` module
- `{boolean} running` True after [Conjure.prototype.run](#conjureprototyperun) executes

**Parameters:**

- `{function} requireCasper` CasperJS-env require()

**See:**

- [Bddflow](https://github.com/codeactual/weir/blob/master/docs/Bddflow.md)

<sub>Go: [TOC](#tableofcontents)</sub>

# Conjure.createContext(parent, pluck, omit)

> Build a context object that includes:

- All enumerable keys from the parent.
- Where functions are bound to the parent.

**Parameters:**

- `{object} parent`
- `{string | array} pluck` Key(s) from parent to pluck.
- `{string | array} omit` Key(s) from parent to omit.

**Return:**

`{object}`

<sub>Go: [TOC](#tableofcontents) | [Conjure](#toc_conjure)</sub>

<a name="conjureprototype"></a>

# Conjure.prototype.isRunning()

> Check if `run()` has been called.

**Return:**

`{boolean}`

<sub>Go: [TOC](#tableofcontents) | [Conjure.prototype](#toc_conjureprototype)</sub>

# Conjure.prototype.test(name, cb)

> Run the suite/root `describe()`.

Perform last-minute init based on collected configuration.
Silently add an initial describe() to verify initial URL/selector.

**Parameters:**

- `{string} name`
- `{function} cb`

<sub>Go: [TOC](#tableofcontents) | [Conjure.prototype](#toc_conjureprototype)</sub>

# Conjure.prototype.run()

> Run collected BBD layers.

<sub>Go: [TOC](#tableofcontents) | [Conjure.prototype](#toc_conjureprototype)</sub>

# Conjure.prototype.popStatus()

> Decrement the current stack depth for trace logs.

<sub>Go: [TOC](#tableofcontents) | [Conjure.prototype](#toc_conjureprototype)</sub>

# Conjure.prototype.pushStatus()

> Increment the current stack depth for trace logs and emit a status
event with the name of the depth change source.

All args match [Conjure](#conjurerequirecasper).prototype.status.

<sub>Go: [TOC](#tableofcontents) | [Conjure.prototype](#toc_conjureprototype)</sub>

<a name="helpersasync"></a>

<a name="helpers"></a>

# helpers.async.click(sel, [nativeClick=false])

> click() alternative that uses jQuery selectors and first waits for a match.

**Usage:**

```js
this.conjure.click('body'); // jQuery click
this.conjure.click('body', true); // native CasperJS click
```

**Parameters:**

- `{string} sel`
- `{boolean} [nativeClick=false]` Use `thenClick()` instead of jQuery's `click()`

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

# helpers.async.then(cb, [lastStep=true])

> `then()` alternative that with access to the same API as `it()`.

**Usage:**

```js
this.conjure.then(function() {
  var validate = this.conjure.require('./lib/validation.js');
  this.test.assert(validate.activationCode(this.casper.fetchText('.act-code')));
});
```

**Parameters:**

- `{function} cb`
- `{boolean} [lastStep=true]` Use false to prevent stack trace pop.
  - Ex. Use false in all-but-last-call if a helpers needs to call it multiple time

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

# helpers.async.thenOpen(args*)

> `thenOpen()` alternative that with access to the same API as `it()`.
Alternative to `thenOpen()` that resolves relative paths to `baseUrl` config.

**Usage:**

```js
// Equivalent:
this.conjure.thenOpen('/login');
this.conjure.thenOpen('login');
this.conjure.thenOpen('http://localhost:8000/login');
```

**Parameters:**

- `{mixed} args*` Original `thenOpen()` arguments

**See:**

- [thenOpen](http://casperjs.org/api.html#casper.thenOpen)

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

# helpers.async.assertSelText(sel, text)

> `assertTextExists()` alternative that uses jQuery selectors.

**Usage:**

```js
this.conjure.assertSelText('.username', 'user47');
```

**Parameters:**

- `{string} sel`
- `{string | regexp} text`

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

# helpers.async.each(list, cb)

> `casper.each()` alternative executes the callback inside the custom `then()`.
Callback receives the context of the enclosing `then()`.

**Usage:**

```js
var memberAreas = ['download', 'stats', 'collection'];
this.conjure.each(memberAreas, function(area, idx, list) {
  this.conjure.thenOpen('/#' + area);
  this.conjure.assertSelText('.promote-acct', /Your free trial expires in/);
});
```

**Parameters:**

- `{array} list`
- `{function} cb` Receives (listItem).

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

# helpers.async.openHash(hash, [sel])

> Append a fragment ID to the current URL.

**Usage:**

```js
this.conjure.openHash('inbox');
this.conjure.openHash('inbox', '.msg-actions'); // Then wait for a selector match
```

**Parameters:**

- `{string} hash` Without leading '#'.
- `{string} [sel]` Optional selector to wait for after navigation.

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

# helpers.async.openInitUrl()

> Re-open the initial URL.

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

# helpers.async.selectorExists(sel, [negate], [lastStep=true])

> Alternative to `waitForSelector()` to use jQuery selector support,
ex. ':first' syntax.

**Usage:**

```js
this.conjure.selectorExists('.inbox');

this.conjure.selectorExists('.inbox', true); // Expect selector absence
this.conjure.selectorExists('.inbox', false); // Default

this.conjure.selectorExists('.inbox', false, false); // Skip stack trace pop
this.conjure.selectorExists('.inbox', false, true); // Default
```

**Parameters:**

- `{string} sel`
- `{boolean} [negate]` Use true if selector is not expected to match.
- `{boolean} [lastStep=true]` Use false to prevent stack trace pop.
  - Ex. Use false in all-but-last-call if a helpers needs to call it multiple time

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

# helpers.async.selectorMissing(sel, [lastStep=true])

> Negated `selectorExists()`.

**Usage:**

```js
this.conjure.selectorMissing('.inbox');

this.conjure.selectorMissing('.inbox', false); // Skip stack trace pop
this.conjure.selectorMissing('.inbox', true); // Default
```

**Parameters:**

- `{string} sel`
- `{boolean} [lastStep=true]` Use false to prevent stack trace pop.
  - Ex. Use false in all-but-last-call if a helpers needs to call it multiple time

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

# helpers.async.sendKeys(sel, keys)

> `sendKeys()` alternative that first waits for a selector to exist.

**Usage:**

```js
this.conjure.sendKeys('.username', 'user47');
```

**Parameters:**

- `{string} sel`
- `{string} keys`

<sub>Go: [TOC](#tableofcontents) | [helpers.async](#toc_helpersasync)</sub>

<a name="helperssync"></a>

# helpers.sync.assertType(val, expected, [subject=none])

> `assertType()` alternative that outputs the actual type on mismatch.

**Usage:**

```js
// assertion error message: 'username should be a string'
this.conjure.assertType(val, 'string', 'username');

// assertion error message: 'subject should be a string'
this.conjure.assertType(val, 'string');
```

**Parameters:**

- `{mixed} val`
- `{string} expected` Ex. 'number'
- `{string} [subject=none]` Ex. 'user ID'

<sub>Go: [TOC](#tableofcontents) | [helpers.sync](#toc_helperssync)</sub>

# helpers.sync.require(name)

> `require()` a CasperJS module or any file relative to `--root-dir`.

**Usage:**

```js
// Equivalent:
this.conjure.require('lib/validation');
this.conjure.require('lib/validation.js');
this.conjure.require('./lib/validation');
this.conjure.require('./lib/validation.js');
```

**Parameters:**

- `{string} name` Ex. 'casper' or `./relative/path/module.js`
  - For local file: prefix with leading `./`
  - Ex. './foo' with `--root-dir` is `/path/to/proj` loads `/path/to/proj/foo.js')`

**Return:**

`{mixed}`

<sub>Go: [TOC](#tableofcontents) | [helpers.sync](#toc_helperssync)</sub>

# helpers.sync.url(relUrl)

> Resolve a relative URL to the `baseUrl` config.

**Usage:**

```js
// Equivalent:
this.conjure.url('/login');
this.conjure.url('login');
```

**Parameters:**

- `{string} relUrl`

**Return:**

`{string}`

<sub>Go: [TOC](#tableofcontents) | [helpers.sync](#toc_helperssync)</sub>

_&mdash;generated by [apidox](https://github.com/codeactual/apidox)&mdash;_
