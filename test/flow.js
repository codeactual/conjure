(function() {
  'use strict';

  var cli = require('casper').create().cli;
  var geist = require(cli.raw.get('rootdir') + '/dist/geist').create(require);
  geist.set('cli', cli).set('initUrl', '/').set('initSel', 'body');

  geist.start('all', function() {
    this.it('should pass --grep filter' , function() {
      this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
    });

    this.describe('group 1', function() {
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
    });
  });
})();
