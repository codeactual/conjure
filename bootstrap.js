/**
 * Allow test scripts to simply define a module.exports function that receives
 * a pre-baked conjure instance.
 */

var cli = require('casper').create().cli;
var conjure = require(cli.raw.get('rootdir') + '/dist/conjure').create(require);
conjure.set('cli', cli);
require(cli.raw.get('file'))(conjure);
