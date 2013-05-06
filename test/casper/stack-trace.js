module.exports = function(conjure) {
  'use strict';

  conjure.test('r1', function() {
    this.describe('d1', function() {
      this.it('i1' , function() { this.test.assertEquals(1, 1); });
    });
    this.describe('d2', function() {
      this.describe('d3', function() {
        this.describe('d4', function() {
          this.it('i2' , function() { this.test.assertEquals(1, 1); });
          this.it('should trigger error' , function() { var a; a.b = 1; });
        });
      });
    });
  });
};
