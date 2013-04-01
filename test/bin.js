(function() {
  'use strict';

  var cli = require('casper').create().cli;
  var requireComponent = require(cli.raw.get('rootdir') + '/dist/parapsych');
  var Parapsych = requireComponent('parapsych').Parapsych;
  var parapsych = new Parapsych();

  parapsych
    .set('cli', cli)
    .set('initUrl', '/')
    .set('initSel', 'body')
    .init();

  describe('/', function() {
    it('should display hello world' , function() {
      this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
    });
  });

  parapsych.done();
})();
