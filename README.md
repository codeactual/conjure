# conjure

Parallel CasperJS runner, BDD flow, module-based tests, API helpers

* `describe()/it()` and hooks via [weir](https://github.com/codeactual/weir)
* `require('relative/path/in/my/proj/module.js)`
* Bootstrap test modules with common settings and arguments
* Full access to standard CasperJS APIs
* [Helpers](docs/Conjure.md#toc_helpers) use preexisting jQuery for selectors
* Stack traces that cover `describe()/it()` and helpers

[![Build Status](https://travis-ci.org/codeactual/conjure.png)](https://travis-ci.org/codeactual/conjure)

## Examples

### Basic test module

```js
module.exports = function(conjure) {
  conjure.set('initPath', '/login').set('initSel', '.login');
  conjure.test('login page', function() {
    this.describe('form', function() {
      this.it('should not auto-check "Remember Me"' , function() {
        this.conjure.selectorExists('.remember-me');
        this.conjure.selectorMissing('.remember-me:checked');
      });
    });
  });
};
```

### Stack traces

* Displayed after the standard `CasperJS` trace.
* Cover `describe()/it()` and helpers.

**After `TypeError`:**

![Trace screenshot](http://codeactual.github.io/conjure/default-trace.png)

_By default, traces are limited to logs from the most recent `it()`._

**After `TypeError` with `--full-trace`:**

![Trace screenshot](http://codeactual.github.io/conjure/full-trace.png)

**After a timeout:**

_Consecutive repeats are collapsed into a count (ex. `x 34`)._

![Timeout trace screenshot](http://codeactual.github.io/conjure/timeout-trace.png)

[More Examples](docs/examples.md)

## CLI

Basic run:

    conjure --server /path/to/myproj/http-server

> Start the server.
> Run all test scripts under `<cwd>/test` that end with `.js`.
> Kill the server.

[More Examples](docs/cli.md)

## API

### Context properties in `it()` callbacks

* `utils`: Native CasperJS module.
* `colorizer`: Native CasperjS module.
* `casper`: Native CasperJS module.
* `conjure`: Helpers described below.
* Custom properties added to `this` in subsequently executed hooks and `it()` callbacks.

### API

* [Helpers](docs/Conjure.md#toc_helpers)
* [Examples](docs/examples.md)

## Installation

### [NPM](https://npmjs.org/package/conjure)

    npm install conjure

## Tests

    npm test

[Documentation](docs/testing.md)

## License

  MIT
