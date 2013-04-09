# Examples

## Bootstrap global settings and custom arguments

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

# Context properties in `it()` callbacks

* `utils`: Native CasperJS module.
* `colorizer`: Native CasperjS module.
* `casper`: Native CasperJS module.
* `conjure`: Helpers described below.
* Custom properties added to `this` in subsequently executed hooks and `it()` callbacks.

# `this.conjure` helper set

## `click(cb)`

> click() alternative that uses jQuery selectors and first waits for a match.

## `then(cb)`

> then() alternative that with access to the same API as it().

## `assertSelText(sel, text)`

> assertTextExists() alternative that uses jQuery selectors.

## `assertType(val, expected, subject)`

> assertType() alternative that reveals the actual type on mismatch.

* `{string} subject` Ex. 'user ID'

## `each(list, cb)`

> casper.each() alternative executes the callback inside the custom then().
> Callback receives the context of the enclosing then().

## `openHash(hash, sel)`

> Append a fragment ID to the current URL.

## `openInitUrl()`

> Re-open the initial URL.

## `require(name)`

> require() a CasperJS module or any file relative to --rootdir.

* For local file: prefix with leading `./`.
 * If rootdir is `/path/to/proj`, `./foo` will lead to `require('/path/to/proj/foo.js')`.

## `selectorExists(sel, [negate])`

> Alternative to waitForSelector() to use jQuery selector support, ex. `:first` syntax.

* Use `negate=true` if selector is not expected to match.

## `selectorMissing(sel)`

> Negated selectorExists().

## `thenSendKeys(sel, keys)`

> sendKeys() wrapper that first waits for a selector to exist.

## `{string} url(relUrl)`

> Convert a relative URL into a full.
