/**
 * Allow test scripts to simply define a module.exports function that receives
 * a pre-baked geist instance.
 */

var cli = require('casper').create().cli;
var geist = require(cli.raw.get('rootdir') + '/dist/geist').create(require);
geist.set('cli', cli);
require(cli.raw.get('file'))(geist);
