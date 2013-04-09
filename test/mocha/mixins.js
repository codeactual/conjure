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
    this.stubs = {}; // Namespace the stubs for sanity.

    this.conjure = conjure.create();
    this.stubs.conjure = this.stub(this.conjure);

    // Stub targets.
    this.testApi = {}; // CasperJS testing API
    this.conjure.casper = {};
    this.extendResult = {}; // extend() component
    this.createdContext = {}; // createdContext() return value

    // Use for stubs like: $(sel).<some method>()
    this.stubs.$result = {};

    // Use this.$stub to know what selector $ received.
    GLOBAL.$ = function() {};
    this.stubs.$ = this.stub(GLOBAL, '$').returns(this.stubs.$result);

    // Collection of fixtures and more prepared stubs.
    this.sel = '.klass';
    this.stubs.cb = this.stub();
    this.stubs.thenEval = this.stubMany(this.conjure.casper, 'thenEvaluate').thenEvaluate;
    this.stubs.$click = this.stubMany(this.stubs.$result, 'click').click;
    this.stubs.casperThen = this.stubMany(this.conjure.casper, 'then').then;

    this.stubs.createContext = this.stub(Conjure, 'createContext');
    this.stubs.createContext.returns(this.createdContext);

    this.stubs.extend = this.stub();
    this.stubs.extend.returns(this.extendResult);

    this.stubs.require = this.stub();
    this.stubs.require.withArgs('extend').returns(this.stubs.extend);
    conjure.setRequire(this.stubs.require);
  });

  describe('click', function() {
    beforeEach(function() {
      this.stubs.thenEval.yields(this.sel);
      this.stubs.conjure.click.restore();
      this.conjure.click(this.sel);
    });
    it('should wait for selector match' , function() {
      this.stubs.conjure.selectorExists.calledWithExactly(this.sel);
    });
    it('should use jQuery to click' , function() {
      this.stubs.thenEval.should.be.called;
      this.stubs.$.should.have.been.calledWithExactly(this.sel);
      this.stubs.$click.should.have.been.called;
    });
  });

  describe('then', function() {
    beforeEach(function() {
      this.stubs.casperThen.yieldsOn({test: this.testApi});
      this.stubs.conjure.then.restore();
      this.conjure.then(this.stubs.cb);

    });
    it('should wait for selector match' , function() {
      this.stubs.cb.should.have.been.calledOn(this.extendResult);
    });
  });
});
