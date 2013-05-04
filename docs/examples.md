# Basic test

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

# Bootstrap global settings and custom arguments

```js
// bootstrap module
module.exports = function(conjure, testFile) {
  conjure.set('baseUrl', 'http://localhost:9000/admin');

  // If test location is '/path/to/proj/test/register/validation.js',
  // then testFile is 'register/validation.js'

  return ['foo', 'bar'];
};

// test module
module.exports = function(conjure, customArg1, customArg2) {
  // baseUrl = 'http://localhost:9000/admin'
  // customArg1 = 'foo'
  // customArg2 = 'bar'
};

```
