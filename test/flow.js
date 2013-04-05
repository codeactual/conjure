module.exports = function(conjure) {
  'use strict';

  conjure.test('all', function() {
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
};
