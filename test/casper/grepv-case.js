module.exports = function(conjure) {
  'use strict';

  conjure.test('--grepv-case', function() {
    this.it('should let this run' , function() {
      this.test.assertEquals(this.fetchText('body').trim(), 'Hello World');
    });

    this.it('should prevent this from running' , function() {
      this.test.assertEquals(true, false);
    });
  });
};
