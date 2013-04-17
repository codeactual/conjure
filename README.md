# conjure

Parallel CasperJS runner, BDD flow, module-based tests, API helpers

* `describe()/it()` and hooks via [bdd-flow](https://github.com/codeactual/bdd-flow)
* `require('relative/path/in/my/proj/module.js)`
* Bootstrap test modules with common settings and arguments
* Full access to standard CasperJS APIs
* [Helpers]](docs/test-api.md) use preexisting jQuery for selectors

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

[More examples](docs/test-api.md)

## CLI

Basic run:

    conjure --server /path/to/myproj/http-server

> Start the server.
> Run all test scripts under `&lt;cwd&gt;/test` that end with `.js`.
> Kill the server.

[CLI Documentation](docs/cli.md)

## API

```js
var casper = require('casper').create();
var conjure = require(rootDir + '/dist/conjure').create(require);
conjure.set('cli', casper.cli);
conjure.test('Login page', function() {
  this.it('should not auto-check "Remember Me"' , function() {
    this.conjure.selectorExists('.remember-me');
    this.conjure.selectorMissing('.remember-me:checked');
  });
});
```

### Documentation

* [Test API](docs/test-api.md)
* [Internal API](docs/internal-api.md)

## Installation

### CLI and API

    npm install conjure

### API [component](https://github.com/component/component) only

    component install codeactual/conjure

## Tests

[Test Documentation](docs/testing.md)

## License

  MIT
