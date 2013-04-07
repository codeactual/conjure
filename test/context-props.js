module.exports = function(conjure) {
  'use strict';

  function assertCommonProps(loc) {
    this.assertType(this.sutContext.casper, 'object', 'this.casper in #' + loc);
    this.assertType(this.sutContext.utils, 'object', 'this.utils in #' + loc);
    this.assertType(this.sutContext.colorizer, 'object', 'this.colorizer in #' + loc);
  }

  conjure.test('context properties', function() {
    this.describe('in #before', function() {
      this.before(function() { this.sutContext = this; });

      this.it('should include' , function() {
        assertCommonProps.call(this, 'before');
      });

      this.it('should omit' , function() {
        this.assertType(this.sutContext.test, 'undefined', 'this.test in #before');
      });
    });

    this.describe('in #beforeEach', function() {
      this.beforeEach(function() { this.sutContext = this; });

      this.it('should include' , function() {
        assertCommonProps.call(this, 'beforeEach');
      });

      this.it('should omit' , function() {
        this.assertType(this.sutContext.test, 'undefined', 'this.test in #beforeEach');
      });
    });

    this.describe('in #it', function() {
      this.it('should include' , function() {
        this.sutContext = this;
        assertCommonProps.call(this, 'it');
      });
    });
  });
};
