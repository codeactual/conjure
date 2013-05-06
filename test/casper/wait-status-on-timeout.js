module.exports = function(conjure) {
  conjure.set('initSel', '.selector-does-not-exist');
  conjure.test('root describe', function() {
    this.it('should pass', function() {
      this.test.assertEquals(1, 1);
    });
  });
};
