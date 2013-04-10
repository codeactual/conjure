# Module

## `create(require)`

> Create a new `Conjure` instance. Pass the CasperJS-environment `require`.

## `mixinConjure(ext)`

> Extend `Conjure.prototype` with function set `ext`.

## `mixinHelpers(ext)`

> Extend the [Test API](docs/test-api.md) helper set.

# Conjure

## `set(key, val) / get(key)`

* `{string} baseUrl`: Of target test server. `[http://localhost:8174]`
* `{string} initPath`: Wait for this relative path to load before starting tests. `[/]`
* `{string} initSel`: Wait for this selector (on `initPath`) before starting tests. `[body]`
* `{object} casperConfig`: Native CasperJS `create()` settings. Default:

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

To modifiy:

* `get() + set()` from a test script.
* Or apply globally using a `--bootstrap` module.

## `test(name, cb)`

> Enclose all `describe()/it()` and hooks. Act as the root `describe()`.

## `isRunning()`

> Check if run() has been called.

## `run()`

> Run collected BBD layers.
