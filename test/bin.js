(function() {
  'use strict';

  var cli = require('casper').create().cli;
  var parapsych = require(cli.raw.get('rootdir') + '/dist/parapsych').create(require);

  parapsych.set('cli', cli)
    .set('initUrl', '/')
    .set('initSel', 'body');

  describe('group 1', function() {
    it('should pass --grep filter' , function() {
      this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
    });

    it('should not pass --grep filter' , function() {
      this.test.assertEquals(true, false);
    });
  });

  describe('group 2', function() {
    it('should pass --grep filter' , function() {
      this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
    });

    it('should not pass --grep filter' , function() {
      this.test.assertEquals(true, false);
    });
  });

  parapsych.done();
})();
