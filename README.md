# conjure

Parallel CasperJS runner and API helpers:

* `describe() / it()` flow with nesting via [bdd-flow](https://github.com/codeactual/bdd-flow).
* Define tests as regular node.js modules.
* `require()` local files.
* Pass common settings and custom arguments to all test modules via bootstrap file.
* Helpers rely on existing jQuery for selector matching.

[![Build Status](https://travis-ci.org/codeactual/conjure.png)](https://travis-ci.org/codeactual/conjure)

## Examples

### API: Basic test

```js
module.exports = function(conjure) {
  conjure.set('initPath', '/login').set('initSel', '.login');

  conjure.test('login page', function() {
    this.describe('form', function() {
      this.it('should have correct title' , function() {
        this.test.assertEquals(this.getTitle(), 'Login - MyService');
      });

      this.it('should not auto-check "Remember Me"' , function() {
        this.selectorExists('.remember-me');
        this.selectorMissing('.remember-me:checked');
      });
    });
  });
};
```

### Bootstrapping

```js
// bootstrap module
module.exports = function(conjure, testFile) {
  conjure.set('baseUrl', 'http://localhost:9000/admin');

  // ... branch logic based on 'testFile'

  return ['foo', 'bar'];
};

// test module
module.exports = function(conjure, customArg1, customArg2) {
  // baseUrl = 'http://localhost:9000/admin'
  // customArg1 = 'foo'
  // customArg2 = 'bar'
};

```

### CLI: Basic run

> Start the server.
> Run all test scripts under `&lt;--rootdir&gt;/test` that end with `.js`.
> Kill the server.

    conjure --server /path/to/myproj/http-server

### CLI: Custom concurrency

    conjure \
    --server /path/to/myproj/http-server \
    --concurrency 3

### CLI: Test case filtering via `--grep`

> Find all test scripts under `&lt;--rootdir&gt;/test` that end with `.js`.
> Only use `it()` expectations that match `/validate$/`.

    conjure \
    --server /path/to/myproj/http-server \
    --grep validate\$

### CLI: Custom file layout/location

> Find all test scripts under `&lt;--rootdir&gt;/&lt;--test&gt;` that end with `test.js`.

    conjure \
    --server /path/to/myproj/http-server \
    --rootdir /path/to/my/proj
    --test custom_test_dir
    --file "/test\.js$/"

## Installation

### [Component](https://github.com/component/component)

Install to `components/`:

    $ component install codeactual/conjure

Build standalone file in `build/`:

    $ grunt dist

## Module API

### `create(require)`

> Create a new `Conjure` instance. Pass the CasperJS-environment `require`.

### `mixin(ext)`

> Extend `Conjure.prototype` with function set `ext`.

## Conjure API

### `set(key, val) / get(key)`

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

To modifiy, `get() + set()`.

### `test(name, cb)`

> Encloses all test expectations. Arguments are internally processed by describe().

### `describe(name, cb)`

> Add a BDD describe() subject.

### `it(name, cb)`

> Add a BDD it() expectation. Enforce --grep.

### `{string} url(relUrl)`

> Convert a relative URL into a full.

### `run()`

> Run collected BBD layers.

## `it()` API

Selector matching relies on jQuery's `$` already being present.

### `andClick(cb)`

> Wait for matching element to exist, then click it.

### `andThen(cb)`

> then() wrapper that injections the same context as the outer it().

### `assertSelText(sel, text)`

> assertTextExists() alternative that uses jQuery selectors.

### `forEach(list, cb)`

> casper.each() alternative that injects the same context as the outer it().

### `openHash(hash, sel)`

> Append a fragment ID to the current URL.

### `openInitUrl()`

> Re-open the initial URL.

### `require(name)`

> require() any file relative to `--rootdir`.

If rootdir is `/path/to/proj`, `'./foo'` will require `/path/to/proj/foo.js`.

### `selectorExists(sel, [negate])`

> Alternative to waitForSelector() to use jQuery selector support, ex. `:first` syntax.

* Use `negate=true` if selector is not expected to match.

### `selectorMissing(sel)`

> Negated selectorExists().

### `thenSendKeys(sel, keys)`

> sendKeys() wrapper that first waits for a selector to exist.

## License

  MIT

## Tests

    npm install --devDependencies
    npm test

## Change Log

### 0.1.0

* Initial CLI: `--concurrent`, `--grep`, `--file`, `--server`, `--root`, `--test`
* Initial API: `openInitUrl()`, `require()`, `selectorExists()`, `selectorMissing()`, `andClick()`, `forEach()`, `openHash()`, `andThen()`, `thenSendKeys()`, `assertSelText()`
