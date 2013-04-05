/**
 * Allow test scripts to simply define a module.exports function that receives
 * a pre-baked conjure instance.
 */

var cli = require('casper').create().cli;
var rootDir = cli.raw.get('rootdir');
var conjure = require(rootDir + '/dist/conjure').create(require);
conjure.set('cli', cli);

var testModuleArgs = [conjure];
var customBootFile = cli.raw.get('bootstrap');

if (customBootFile) {
  if (/^[^/]/.test(customBootFile)) { // Resolve 'relPath.js' and './relPath.js'
    customBootFile = rootDir + '/' + customBootFile;
  }

  // Append any defined value to the argument set passed to the test script.
  // Array contents will be appended individually.
  var customArgs = require(customBootFile)(conjure);
  if (typeof customArgs !== 'undefined') {
    testModuleArgs = testModuleArgs.concat(customArgs);
  }
}

require(cli.raw.get('file')).apply(null, testModuleArgs);
