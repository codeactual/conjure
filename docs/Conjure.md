Parallel CasperJS runner, BDD flow, module-based tests, API helpers

_Source: [lib/conjure/index.js](../lib/conjure/index.js)_

- [exports.Conjure](#exportsconjure)
- [exports.create](#exportscreaterequirecasper)
- [exports.extendConjure](#exportsextendconjureext)
- [exports.extendHelpers](#exportsextendhelpersext)
- [Conjure](#conjurerequirecasper)
- [Conjure.createContext](#conjurecreatecontextparent-pluck-omit)
- [Conjure.prototype.isRunning](#conjureprototypeisrunning)
- [Conjure.prototype.test](#conjureprototypetestname-cb)
- [Conjure.prototype.run](#conjureprototyperun)
- [helpers.click](#helpersclicksel)
- [helpers.then](#helpersthencb)
- [helpers.assertSelText](#helpersassertseltextsel-text)
- [helpers.assertType](#helpersasserttypeval-expected-subject)
- [helpers.each](#helperseachlist-cb)
- [helpers.openHash](#helpersopenhashhash-sel)
- [helpers.openInitUrl](#helpersopeniniturl)
- [helpers.require](#helpersrequirename)
- [helpers.selectorExists](#helpersselectorexistssel-negate)
- [helpers.selectorMissing](#helpersselectormissingsel)
- [helpers.sendKeys](#helperssendkeyssel-keys)
- [helpers.url](#helpersurlrelurl)

# exports.Conjure()

> Reference to [Conjure](#conjurerequirecasper).

# exports.create(requireCasper)

> Create a new [Conjure](#conjurerequirecasper).

**Parameters:**

- `{object} requireCasper` Casper-land `require()`

**Return:**

`{object}`

# exports.extendConjure(ext)

> Extend [Conjure](#conjurerequirecasper).prototype.

**Parameters:**

- `{object} ext`

**Return:**

`{object}` Merge result.

# exports.extendHelpers(ext)

> Extend the object that includes functions like helper.selectorExists.

**Parameters:**

- `{object} ext`

**Return:**

`{object}` Merge result.

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
- `{object} flow` `Bddflow` instance
- `{object} utils` Native CasperJS `utils` module
- `{object} colorizer` Native CasperJS `colorizer` module
- `{boolean} running` True after [Conjure.prototype.run](#conjureprototyperun) executes

**Parameters:**

- `{function} requireCasper` CasperJS-env require()

**See:**

- [Bddflow](https://github.com/codeactual/bdd-flow/blob/master/docs/Bddflow.md)

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

# Conjure.prototype.isRunning()

> Check if (internal) run() has been called.

**Return:**

`{boolean}`

# Conjure.prototype.test(name, cb)

> Run the suite/root `describe()`.

Perform last-minute init based on collected configuration.
Silently add an initial describe() to verify initial URL/selector.

**Parameters:**

- `{string} name` Suite/root-`describe()` name
- `{function} cb`

# Conjure.prototype.run()

> Run collected BBD layers.

# helpers.click(sel)

> click() alternative that uses jQuery selectors and first waits for a match.

**Parameters:**

- `{string} sel`

# helpers.then(cb)

> then() alternative that with access to the same API as it().

**Parameters:**

- `{function} cb`

# helpers.assertSelText(sel, text)

> assertTextExists() alternative that uses jQuery selectors.

**Parameters:**

- `{string} sel`
- `{string | regexp} text`

# helpers.assertType(val, expected, subject)

> assertType() alternative that reveals the actual type on mismatch.

**Parameters:**

- `{mixed} val`
- `{string} expected` Ex. 'number'
- `{string} subject` Ex. 'user ID'

# helpers.each(list, cb)

> casper.each() alternative executes the callback inside the custom then().
Callback receives the context of the enclosing then().

**Parameters:**

- `{array} list`
- `{function} cb` Receives (listItem).

# helpers.openHash(hash, [sel])

> Append a fragment ID to the current URL.

**Parameters:**

- `{string} hash` Without leading '#'.
- `{string} [sel]` Optional selector to wait for after navigation.

# helpers.openInitUrl()

> Re-open the initial URL.

# helpers.require(name)

> require() a CasperJS module or any file relative to --rootdir.

**Parameters:**

- `{string} name` Ex. 'casper' or './relative/path/module.js'.

For local file: prefix with leading './'.
If rootdir is /path/to/proj, './foo' will lead to require('/path/to/proj/foo.js').

**Return:**

`{mixed}` Loaded module.

# helpers.selectorExists(sel, [negate])

> Alternative to waitForSelector() to use jQuery selector support,
ex. ':first' syntax.

**Parameters:**

- `{string} sel`
- `{boolean} [negate]` Use true if selector is not expected to match.

# helpers.selectorMissing(sel)

> Negated selectorExists().

**Parameters:**

- `{string} sel`

# helpers.sendKeys(sel, keys)

> sendKeys() alternative that first waits for a selector to exist.

**Parameters:**

- `{string} sel`
- `{string} keys`

# helpers.url(relUrl)

> Convert a relative URL into a full.

**Parameters:**

- `{string} relUrl` Includes leading slash.

**Return:**

`{string}`

_&mdash;generated by [gitemplate-dox](https://github.com/codeactual/gitemplate-dox)&mdash;_