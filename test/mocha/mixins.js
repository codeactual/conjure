var sinon = require('sinon');
var chai = require('chai');

var should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

var conjure = require('../../dist/conjure');
var Conjure = conjure.Conjure;
var requireComponent = conjure.require;

requireComponent('sinon-doublist')(sinon, 'mocha');

describe('mixins', function() {
  'use strict';

  beforeEach(function() {
    this.conjure = conjure.create();
    this.conjureStub = this.stub(this.conjure);

    this.conjure.casper = {};

    // Use for stubs like: $(sel).<some method>()
    this.$resStub = {};

    // Use this.$stub to know what selector $ received.
    GLOBAL.$ = function() {};
    this.$stub = this.stub(GLOBAL, '$').returns(this.$resStub);

    // Collection of fixtures and more prepared stubs.
    this.sel = '.klass';
    this.evalStub = this.stubMany(this.conjure.casper, 'thenEvaluate').thenEvaluate;
    this.clickStub = this.stubMany(this.$resStub, 'click').click;
  });

  describe('click', function() {
    beforeEach(function() {
      this.evalStub.yields(this.sel);
      this.conjureStub.click.restore();
      this.conjure.click(this.sel);
    });
    it('should wait for selector match' , function() {
      this.conjureStub.selectorExists.calledWithExactly(this.sel);
    });
    it('should use jQuery to click' , function() {
      this.evalStub.should.be.called;
      this.$stub.should.have.been.calledWithExactly(this.sel);
      this.clickStub.should.have.been.called;
    });
  });
});
