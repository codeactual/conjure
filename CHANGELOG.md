# 0.1.4

- feat(cli): Echo test server stdout/stderr
- feat(cli): Abort on `--server` death
- fix(cli): Verify `--server` file exists
- fix(cli): Filter `--bootstrap` from `--test-dir` scan
- fix(cli): Normalize paths (for verbose output use in debugging)

# 0.1.3

- feat(helpers): Resolve `thenOpen()` relative paths to `baseUrl` config.
- feat(helpers): Make `url()` leading slash optional.
- fix(log): Move `initPath/initSel` output to `trace()` to reduce noise.
- chore(npm): Upgrade outdated dev dependencies

# 0.1.2

- Upgrade `apidox` and dependents.

# 0.1.1

- Fix bad references to renamed module `bdd-flow` (now `weir`).
- Remove NPM shrinkwrapping.

# 0.1.0

- Add stack traces on error and `--full-trace`.
- Initial CLI: `--concurrency`, `--grep-case`, `--grepv-case`, `--grep-file`, `--server`, `--root-dir`, `--test-dir`, `--timeout`, `--verbose`, `--full-trace`.
- Initial API: `openInitUrl()`, `require()`, `selectorExists()`, `selectorMissing()`, `click()`, `each()`, `openHash()`, `then()`, `sendKeys()`, `assertSelText()`
