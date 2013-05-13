module.exports = function(conjure) {
  'use strict';

  conjure.test('r1', function() {
    this.describe('click', function() {
      this.it('should tag last step in native-click mode' , function() {
        this.conjure.click('body', true);
      });
      this.it('should tag last step in jQuery-click mode' , function() {
        this.conjure.click('body');
      });
    });

    this.describe('then', function() {
      this.it('should tag last step' , function() {
        this.conjure.then(function() {
          this.test.assertEquals(1, 1);
        });
      });
    });

    this.describe('thenOpen', function() {
      this.it('should tag last step' , function() {
        this.conjure.thenOpen('/', function() {
        });
      });
    });

    this.describe('assertSelText', function() {
      this.it('should tag last step' , function() {
        this.conjure.assertSelText('body', /.?/);
      });
    });

    this.describe('each', function() {
      this.it('should tag last step' , function() {
        this.conjure.each([1], function() {
          this.test.assertEquals(1, 1);
        });
      });
    });

    this.describe('openHash', function() {
      this.it('should tag last step when not waiting for selector' , function() {
        this.conjure.openHash('foo');
      });
      this.it('should tag last step when waiting for selector' , function() {
        this.conjure.openHash('foo', 'body');
      });
    });

    this.describe('openInitUrl', function() {
      this.it('should tag last step' , function() {
        this.conjure.openInitUrl();
      });
    });

    this.describe('selectorExists', function() {
      this.it('should tag last step' , function() {
        this.conjure.selectorExists('body');
      });
    });

    this.describe('selectorMissing', function() {
      this.it('should tag last step' , function() {
        this.conjure.selectorMissing('.not-present');
      });
    });

    this.describe('sendKeys', function() {
      this.it('should tag last step' , function() {
        this.conjure.sendKeys('body', 'foo');
      });
    });

    this.describe('next test', function() {
      this.it('should trigger error' , function() { var a; a.b = 'foo'; });
    });
  });
};

function conjureLastStepTestNoOp() {}
