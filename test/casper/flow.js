module.exports = function(conjure) {
  'use strict';

  // Quick bdd-flow smoke test. bdd-flow suites cover its nesting in more depth.
  conjure.test('bdd-flow integration', function() {
    this.describe('describe1', function() {
      this.describe('describe2', function() {
        this.describe('describe3', function() {
          this.it('it1' , function() {
            console.log('path=' + this.__conjure__path);
            this.test.assert(true);
          });
        });
      });
    });
  });
};
