# Examples

    conjure --help

## CLI: Custom concurrency

    conjure \
    --server /path/to/myproj/http-server \
    --concurrency 3

## CLI: Test case filtering via `--grep-case`

> Find all test scripts under `&lt;cwd&gt;/test` that end with `.js`.
> Only use `it()` expectations that match `/validate$/`.

    conjure \
    --server /path/to/myproj/http-server \
    --grep-case validate\$

## CLI: Custom file layout/location

> Find all test scripts under `&lt;--root-dir&gt;/&lt;--test-dir&gt;` that end with `test.js`.

    conjure \
    --server /path/to/myproj/http-server \
    --root-dir /path/to/my/proj
    --test-dir custom_test_dir
    --grep-file "test\.js$"

