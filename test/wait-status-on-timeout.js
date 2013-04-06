module.exports = function(conjure) {
  conjure.set('initSel', '.selector-does-not-exist');

  conjure.test('flow', function() {
    this.it('should pass' , function() {
      this.test.assertEquals(1, 1);
    });
  });
};
