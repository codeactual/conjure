module.exports = function(conjure) {
  'use strict';

  function assertCommonProps(test, loc) {
    var types = {casper: 'object', utils: 'object', colorizer: 'object'};
    Object.keys(types).forEach(function(prop) {
      test.conjure.assertType(
        test[loc + 'Context'][prop],
        types[prop],
        'this.' + prop + ' in ' + loc
      );
    });
  }

  function refuteCommonProps(test, loc) {
    var props = ['flow', 'settings', 'running'];
    props.forEach(function(prop) {
      test.conjure.assertType(
        test[loc + 'Contextd'][prop],
        'undefined',
        'this.' + prop + ' in ' + loc
      );
    });
  }

  conjure.test('context properties', function() {
    this.describe('in then', function() {
      this.it('should pluck expected' , function() {
        this.conjure.then(function() {
          this.thenContext = this;
          assertCommonProps(this, 'then');
          refuteCommonProps(this, 'then');
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
      });
    });

    this.describe('in beforeEach', function() {
      this.beforeEach(function() { this.beforeEachContext = this; });
      this.it('should pluck expected' , function() {
        assertCommonProps(this, 'beforeEach');
      });
      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'beforeEach');
      });
    });

    this.describe('in it', function() {
      this.it('should pluck expected' , function() {
        this.itContext = this;
        assertCommonProps(this, 'it');
      });
      this.it('should omit expected' , function() {
        refuteCommonProps(this, 'it');
        this.conjure.assertType(this.itContext.it, 'undefined', 'this.it in it');
        this.conjure.assertType(this.itContext.describe, 'undefined', 'this.describe in it');
        this.conjure.assertType(this.itContext.before, 'undefined', 'this.before in it');
      });
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
      });
    });
  });
};
