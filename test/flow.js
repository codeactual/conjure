module.exports = function(conjure) {
  'use strict';

  // TODO focus this script on properties available at different flow contexts

  conjure.test('flow', function() {
    this.describe('Conjure', function() {
      this.it('should pass' , function() {
        this.test.assertEquals(1, 1);
      });
    });
  });
};
