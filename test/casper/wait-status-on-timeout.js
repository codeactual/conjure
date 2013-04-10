module.exports = function(conjure) {
  conjure.set('initSel', '.selector-does-not-exist');
  conjure.test('', function() {});
};
