module.exports = function(conjure) {
  'use strict';

  conjure.test('flow', function() {
    this.describe('Conjure', function() {
      this.describe('url()', function() {
        this.it('should pass' , function() {
          this.test.assertEquals(1, 1);
        });
      });
    });
  });
};
