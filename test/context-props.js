module.exports = function(conjure) {
  'use strict';

  function assertCommonProps(test, loc) {
    test.assertType(test[loc + 'Context'].casper, 'object', 'this.casper in ' + loc);
    test.assertType(test[loc + 'Context'].utils, 'object', 'this.utils in ' + loc);
    test.assertType(test[loc + 'Context'].colorizer, 'object', 'this.colorizer in ' + loc);
    test.assertType(test[loc + 'Context'].andThen, 'function', 'this.andThen in ' + loc);
  }

  function refuteCommonProps(test, loc) {
    test.assertType(test[loc + 'Context'].flow, 'undefined', 'this.flow in ' + loc);
    test.assertType(test[loc + 'Context'].settings, 'undefined', 'this.settings in ' + loc);
    test.assertType(test[loc + 'Context'].running, 'undefined', 'this.running in ' + loc);
  }

  conjure.test('context properties', function() {
    this.describe('in andThen', function() {
      this.it('should pluck expected' , function() {
        this.andThen(function() {
          this.andThenContext = this;
          assertCommonProps(this, 'andThen');
          refuteCommonProps(this, 'andThen');
        });
      });
    });

    this.describe('in before', function() {
      this.before(function() { this.beforeContext = this; });
      this.it('should pluck expected' , function() {
        assertCommonProps(this, 'before');
      });
      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'before');
        this.assertType(this.beforeContext.test, 'undefined', 'this.test in before');
      });
    });

    this.describe('in beforeEach', function() {
      this.beforeEach(function() { this.beforeEachContext = this; });
      this.it('should pluck expected' , function() {
        assertCommonProps(this, 'beforeEach');
      });
      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'beforeEach');
        this.assertType(this.beforeEachContext.test, 'undefined', 'this.test in beforeEach');
      });
    });

    this.describe('in it', function() {
      this.it('should pluck expected' , function() {
        this.itContext = this;
        assertCommonProps(this, 'it');
      });
      //this.it('should omit expected' , function() {
        //refuteCommonProps(this, 'it');
        //this.assertType(this.itContext.it, 'undefined', 'this.it in it');
        //this.assertType(this.itContext.describe, 'undefined', 'this.describe in it');
        //this.assertType(this.itContext.before, 'undefined', 'this.before in it');
      //});
    });

    this.describe('in after (prep)', function() {
      this.after(function() { this.afterContext = this; });
      this.it('(should trigger an after)' , function() {});
    });
    this.describe('in after', function() {
      this.it('should pluck expected' , function() {
        assertCommonProps(this, 'after');
      });
      this.it('should omit expected', function() {
        refuteCommonProps(this, 'after');
        this.assertType(this.afterContext.test, 'undefined', 'this.test in after');
      });
    });

    this.describe('in afterEach', function() {
      this.afterEach(function() { this.afterEachContext = this; });
      this.it('(should trigger an afterEach)' , function() {});
      this.it('should pluck expected' , function() {
        assertCommonProps(this, 'afterEach');
      });
      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'afterEach');
        this.assertType(this.afterEachContext.test, 'undefined', 'this.test in afterEach');
      });
    });
  });
};
