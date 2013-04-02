# parapsych

CasperJS parallel running, BDD flow, API wrappers

[![Build Status](https://travis-ci.org/codeactual/parapsych.png)](https://travis-ci.org/codeactual/parapsych)

## Examples

### Basic run

> Start the server.
> Run all test scripts under `&lt;--rootdir&gt;/test` that end with `.js`.
> Kill the server.

    parapsych --server /path/to/myproj/http-server

### Custom concurrency

    parapsych \
    --server /path/to/myproj/http-server \
    --concurrency 3

### Test case filtering via `--grep`

> Find all test scripts under `&lt;--rootdir&gt;/test` that end with `.js`.
> Only use `it()` expectations that match `/validate$/`.

    parapsych \
    --server /path/to/myproj/http-server \
    --grep validate\$

### Custom file layout/location

> Find all test scripts under `&lt;--rootdir&gt;/&lt;--test&gt;` that end with `test.js`.

    parapsych \
    --server /path/to/myproj/http-server \
    --rootdir /path/to/my/proj
    --test custom_test_dir
    --file "/test\.js$/"

## Installation

### [Component](https://github.com/component/component)

Install to `components/`:

    $ component install codeactual/parapsych

Build standalone file in `build/`:

    $ grunt dist

## CLI

    -h, --help              output usage information

### Required

    -s, --server <script>   Test server startup script

### Optional

    -c, --concurrent <num>  casperjs process count [2]
    -r, --root <dir>        Project root directory [cwd]
    -t, --test <dir>        Test directory, relative to root [test]
    -f, --file <regex>      Test file regex filter [.js]
    -g, --grep              Test case regex filter [none]

## API

### [method]

> [method desc]

## License

  MIT

## Tests

    npm install --devDependencies
    npm test

## Change Log

### 0.1.0

* Initial CLI: `--concurrent`, `--grep`, `--file`, `--server`, `--root`, `--test`
* Initial API: `openInitUrl()`, `require()`, `selectorExists()`, `selectorMissing()`, `andClick()`, `forEach()`, `openHash()`, `andThen()`, `thenSendKeys()`, `assertSelText()`
