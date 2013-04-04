(function() {
  'use strict';

  var cli = require('casper').create().cli;
  var parapsych = require(cli.raw.get('rootdir') + '/dist/parapsych').create(require);
  parapsych.set('cli', cli).set('initUrl', '/').set('initSel', 'body');

  parapsych.start('all', function() {
    this.it('should pass --grep filter' , function() {
      console.log('keys', Object.keys(this));
      this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
    });

    /*this.describe('group 1', function() {
      this.it('should pass --grep filter' , function() {
        this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
      });

      this.it('should not pass --grep filter' , function() {
        this.test.assertEquals(true, false);
      });
    });

    this.describe('group 2', function() {
      this.it('should pass --grep filter' , function() {
        this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
      });

      this.it('should not pass --grep filter' , function() {
        this.test.assertEquals(true, false);
      });
    });*/
  });
})();
