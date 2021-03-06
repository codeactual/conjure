Reference to [Process](#process).

_Source: [lib/cli/conjure/process.js](../lib/cli/conjure/process.js)_

<a name="tableofcontents"></a>

- <a name="toc_exportscreate"></a><a name="toc_exports"></a>[exports.create](#exportscreate)
- <a name="toc_process"></a>[Process](#process)
- <a name="toc_processprototypespawn"></a><a name="toc_processprototype"></a>[Process.prototype.spawn](#processprototypespawn)
- <a name="toc_processprototypeshowtrace"></a>[Process.prototype.showTrace](#processprototypeshowtrace)

<a name="exports"></a>

# exports.create()

> Create a new [Process](#process).

**Return:**

`{object}`

<sub>Go: [TOC](#tableofcontents) | [exports](#toc_exports)</sub>

# Process()

> Process constructor.

**Configuration:**

- `{object} impulseBin` `ImpulseBin` instance
- `{object} cliOptions`
- `{array} spawnArgs`
- `{string} label` Ex. name of the test file, used for logging
- `{string} testDir` Root test directory

**Properties:**

- `{object} data` `ProcessData` instance that holds stdout/stderr
- `{object} handle` `ChildProcess` instance
- `{boolean} noTestsRan` True if caused by `--grep-case` or `--grepv-case`
- `{object} allStatus` `StatusList` instance that holds all internal messages parsed from stdout
- `{object} rotatedStatus` `StatusList` instance whose items are limited to the most recent `describe()`
- `{object} timeoutId` `setTimeout()` ID created in [Process.prototype.spawn](#processprototypespawn) to enforce `--timeout`

**Inherits:**

- `events.EventEmitter`

**See:**

- [ImpulseBin](https://github.com/codeactual/impulse-bin/blob/master/docs/ImpulseBin.md)
- [ProcessData](ProcessData.md)
- [StatusList](StatusList.md)

<sub>Go: [TOC](#tableofcontents)</sub>

<a name="processprototype"></a>

# Process.prototype.spawn()

> Spawn a single process based on collected configuration.

<sub>Go: [TOC](#tableofcontents) | [Process.prototype](#toc_processprototype)</sub>

# Process.prototype.showTrace()

> Dump all trace messages to stderr.

<sub>Go: [TOC](#tableofcontents) | [Process.prototype](#toc_processprototype)</sub>

_&mdash;generated by [apidox](https://github.com/codeactual/apidox)&mdash;_
