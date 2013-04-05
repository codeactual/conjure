# geist

CasperJS runner:

* Parallel `casperjs` processes with configurable limit.
* `describe()` / `it()` BDD flow.
* CasperJS API wrappers.
 * Callbacks inherit context of outer `it()`.
 * jQuery used for selector matching.
* Local module `require()` support.

[![Build Status](https://travis-ci.org/codeactual/geist.png)](https://travis-ci.org/codeactual/geist)

## Examples

### API use in test script

```js
var cli = require('casper').create().cli;
var geist = require(cli.raw.get('rootdir') + '/node_modules/.bin/geist').create(require);
geist
  .set('cli', cli)
  .set('initUrl', '/')
  .set('initSel', 'body');

describe('index page', function() {
  it('should say hello' , function() {
    this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
  });
});

geist.run();
```

### Basic run

> Start the server.
> Run all test scripts under `&lt;--rootdir&gt;/test` that end with `.js`.
> Kill the server.

    geist --server /path/to/myproj/http-server

### Custom concurrency

    geist \
    --server /path/to/myproj/http-server \
    --concurrency 3

### Test case filtering via `--grep`

> Find all test scripts under `&lt;--rootdir&gt;/test` that end with `.js`.
> Only use `it()` expectations that match `/validate$/`.

    geist \
    --server /path/to/myproj/http-server \
    --grep validate\$

### Custom file layout/location

> Find all test scripts under `&lt;--rootdir&gt;/&lt;--test&gt;` that end with `test.js`.

    geist \
    --server /path/to/myproj/http-server \
    --rootdir /path/to/my/proj
    --test custom_test_dir
    --file "/test\.js$/"

## Installation

### [Component](https://github.com/component/component)

Install to `components/`:

    $ component install codeactual/geist

Build standalone file in `build/`:

    $ grunt dist

## Module API

### `create(require)`

> Create a new `Geist` instance. Pass the CasperJS-environment `require`.

### `mixin(ext)`

> Extend `Geist.prototype` with function set `ext`.

## Geist API

### `describe(desc, cb)`

> Add a BDD describe() subject.

### `it(desc, cb)`

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
