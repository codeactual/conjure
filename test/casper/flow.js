module.exports = function(conjure) {
  'use strict';

  // Quick weir smoke test. weir suites cover its nesting in more depth.
  conjure.test('weir integration', function() {
    this.describe('describe1', function() {
      this.describe('describe2', function() {
        this.describe('describe3', function() {
          this.it('it1', function(done) {
            var self = this;
            console.log('path=' + this.__conjure__path);
            // Brittle workaround for race condition where `casperjs` evaluates
            // the assert() and exits cleanly before console.log() emits to stdout
            // (observed on TravisCI).
            setTimeout(function() {
              self.test.assert(true);
              done();
            }, 200);
          });
        });
      });
    });
  });
};
