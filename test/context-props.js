module.exports = function(conjure) {
  'use strict';

  function assertCommonProps(test, loc) {
    test.assertType(test.sutContext.casper, 'object', 'test.casper in #' + loc);
    test.assertType(test.sutContext.utils, 'object', 'test.utils in #' + loc);
    test.assertType(test.sutContext.colorizer, 'object', 'test.colorizer in #' + loc);
  }

  function refuteCommonProps(test, loc) {
    test.assertType(test.sutContext.flow, 'undefined', 'test.flow in #' + loc);
    test.assertType(test.sutContext.settings, 'undefined', 'test.settings in #' + loc);
    test.assertType(test.sutContext.running, 'undefined', 'test.running in #' + loc);
  }

  conjure.test('context properties', function() {
    this.describe('in #before', function() {
      this.before(function() { this.sutContext = this; });

      this.it('should pluck expected' , function() {
        assertCommonProps(this, 'before');
      });

      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'before');
        this.assertType(this.sutContext.test, 'undefined', 'this.test in #before');
      });
    });

    this.describe('in #beforeEach', function() {
      this.beforeEach(function() { this.sutContext = this; });

      this.it('should pluck expected' , function() {
        assertCommonProps(this, 'beforeEach');
      });

      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'beforeEach');
        this.assertType(this.sutContext.test, 'undefined', 'this.test in #beforeEach');
      });
    });

    this.describe('in #it', function() {
      this.it('should pluck expected' , function() {
        this.sutContext = this;
        assertCommonProps(this, 'it');
      });

      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'it');
      });
    });

    this.describe('in #after', function() {
      this.after(function() {
        this.sutContext = this;
        assertCommonProps(this, 'after');
      });

      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'after');
        this.assertType(this.sutContext.test, 'undefined', 'this.test in #after');
      });
    });

    this.describe('in #afterEach', function() {
      this.after(function() {
        this.sutContext = this;
        assertCommonProps(this, 'afterEach');
      });

      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'afterEach');
        this.assertType(this.sutContext.test, 'undefined', 'this.test in #afterEach');
      });
    });
  });
};
