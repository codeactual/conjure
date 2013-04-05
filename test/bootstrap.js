module.exports = function(conjure, customArg1, customArg2, customArg3) {
  'use strict';

  conjure.test('custom bootstrap module', function() {
    this.it('should pass custom args' , function() {
      this.test.assertEquals(customArg1, {prop1: 'first custom arg'});
      this.test.assertEquals(customArg2, {prop2: 'second custom arg'});
      this.test.assertEquals(customArg3, 'this file: bootstrap.js');
    });

    this.it('should have modified a conjure setting' , function() {
      this.test.assertEquals(conjure.get('initSel'), '.modified-by-custom-bootstrap');
    });
  });
};
