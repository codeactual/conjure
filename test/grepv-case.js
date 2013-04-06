module.exports = function(conjure) {
  'use strict';

  conjure.test('all', function() {
    this.describe('--grepv-case flag in Gruntfile', function() {
      this.it('should let this run' , function() {
        this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
      });

      this.it('should prevent this from running' , function() {
        this.test.assertEquals(true, false);
      });
    });
  });
};
