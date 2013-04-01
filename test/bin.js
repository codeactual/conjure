(function() {
  'use strict';

  var cli = require('casper').create().cli;
  console.log('cli should be:' + Object.keys(cli).length);
  var parapsych = require(cli.raw.get('rootdir') + '/dist/parapsych').create(require);
  console.log('type', parapsych.set);

  parapsych.set('cli', cli)
    .set('initUrl', '/')
    .set('initSel', 'body');

  //parapsych.testContext.init();

  describe('/', function() {
    it('should display hello world' , function() {
      console.log('checking');
      this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
    });
  });

  parapsych.done();
})();
