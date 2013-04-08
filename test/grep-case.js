module.exports = function(conjure) {
  'use strict';

  conjure.test('--grep-case', function() {
    this.it('should only run this' , function() {
      this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
    });

    this.it('should prevent this from running' , function() {
      this.test.assertEquals(true, false);
    });
  });
};
