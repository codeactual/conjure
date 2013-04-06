/**
 * Allow test scripts to simply define a module.exports function that receives
 * a pre-baked conjure instance.
 *
 * Also allow custom `--bootstrap <file>` modules to modify that instance
 * and pass custom arguments to the test module.
 */

var casper = require('casper').create();
var cli = casper.cli;
var rootDir = cli.raw.get('rootdir');
var testDir = cli.raw.get('testdir');
var conjure = require(rootDir + '/dist/conjure').create(require);
conjure.set('cli', cli);

var testFile = cli.raw.get('testfile');
var testModuleArgs = [conjure];
var customBootFile = cli.raw.get('bootstrap');

if (customBootFile) {
  if (/^[^/]/.test(customBootFile)) { // Resolve 'relPath.js' and './relPath.js'
    customBootFile = rootDir + '/' + customBootFile;
  }

  // Append any defined value to the argument set passed to the test script.
  // Array contents will be appended individually.
  var customArgs = require(customBootFile)(
    conjure,
    testFile.replace(rootDir + '/' + testDir + '/', '')
  );
  if (typeof customArgs !== 'undefined') {
    testModuleArgs = testModuleArgs.concat(customArgs);
  }
}

require(testFile).apply(null, testModuleArgs);

if (!conjure.isRunning()) { // Prevent empty tests from timing out.
  conjure.status('bootstrap.js', 'exit', {testFile: testFile, reason: 'NoTestDefined'});
  casper.warn('Did not call conjure.test()');
  casper.exit(1);
}
