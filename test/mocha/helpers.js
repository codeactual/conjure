var sinon = require('sinon');
var chai = require('chai');

var should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

var conjure = require('../../dist/conjure');
var Conjure = conjure.Conjure;
var requireComponent = conjure.require;

requireComponent('sinon-doublist')(sinon, 'mocha');

describe('helpers', function() {
  'use strict';

  /**
   * Pack any remotely reusable boilerplate here to keep the actual tests
   * as small/clear as possible.
   */
  beforeEach(function() {
    var self = this;

    // Stub targets
    this.testApi = {}; // CasperJS's this.test API
    this.utilsApi = {}; // CasperJS's this.utils API
    this.extendResult = {iAmA: 'extend() component'};
    this.createdContext = {iAmA: 'createdContext() return value'};
    this.requiredComponent = {iAmA: 'component-land require() return value'};
    this.evaluateResult = {iAmA: 'casper.evaluate() return value'};
    this.betterTypeOf = {iAmA: 'utils.betterTypeOf() return value'};
    this.format = {iAmA: 'utils.format() return value'};

    this.stubs = {}; // Reusable stub collection

    // Stubbing CasperJS-land require(), ex. for colorizer module
    this.stubs.requiredComponentCreate = this.stubMany(
      this.requiredComponent, 'create'
    ).create;
    this.stubs.casperRequire = this.stub();
    this.stubs.casperRequire.returns(this.requiredComponent);

    this.conjure = conjure.create(this.stubs.casperRequire);
    this.conjure.casper = {}; // Stub target for CasperJS's this.casper API
    this.stubs.conjure = this.stub(this.conjure.conjure);

    // Use for stubs like: $(sel).<some method>().
    this.stubs.$result = {};

    // Use this.$stub to know what selector $ received.
    GLOBAL.$ = function() {};
    this.stubs.$global = this.stub(GLOBAL, '$').returns(this.stubs.$result);

    // More fixtures and prepared stubs
    this.sel = '.klass';
    this.textNeedle = 'foo';
    this.reNeedle = /foo/;
    this.stubs.cb = this.stub();
    this.stubs.$ = this.stubMany(
      this.stubs.$result,
      [
        'click', 'text'
      ]
    );
    this.stubs.utils = this.stubMany(
      this.utilsApi,
      [
        'betterTypeOf', 'format'
      ]
    );
    this.stubs.utils.betterTypeOf.returns(this.betterTypeOf);
    this.stubs.utils.format.returns(this.format);
    this.stubs.test = this.stubMany(
      this.testApi,
      [
        'assertEquals', 'assertMatch'
      ]
    );
    this.stubs.casper = this.stubMany(
      this.conjure.casper,
      [
        'evaluate', 'then', 'thenEvaluate'
      ]
    );
    this.stubs.casper.evaluate.returns(this.evaluateResult);
    var thenContext = {
      test: this.stubs.test,
      evaluate: this.stubs.casper.evaluate,
      utils: this.stubs.utils
    };
    this.stubs.casper.then.yieldsOn(thenContext);
    this.stubs.conjure.then.yieldsOn(thenContext);
    this.stubs.createContext = this.stub(Conjure, 'createContext');
    this.stubs.createContext.returns(this.createdContext);
    this.stubs.extend = this.stub();
    this.stubs.extend.returns(this.extendResult);
    this.stubs.require = this.stub(conjure, 'require');
    this.stubs.require.withArgs('extend').returns(this.stubs.extend);
    conjure.setRequire(this.stubs.require);
    this.restoreComponentRequire = function() {
      conjure.setRequire(requireComponent);
    };
  });

  describe('click', function() {
    beforeEach(function() {
      this.stubs.casper.thenEvaluate.yields(this.sel);
      this.stubs.conjure.click.restore();
      this.conjure.click(this.sel);
    });
    it('should wait for selector match' , function() {
      this.stubs.conjure.selectorExists.calledWithExactly(this.sel);
    });
    it('should use jQuery to click' , function() {
      this.stubs.casper.thenEvaluate.should.be.called;
      this.stubs.$global.should.have.been.calledWithExactly(this.sel);
      this.stubs.$.click.should.have.been.called;
    });
  });

  describe('then', function() {
    beforeEach(function() {
      this.stubs.conjure.then.restore();
      this.conjure.then(this.stubs.cb);
    });
    it('should inject context' , function() {
      this.stubs.extend.should.have.been.calledWith(
        this.createdContext,
        {casper: this.conjure.casper, test: this.testApi}
      );
      this.stubs.cb.should.have.been.calledOn(this.extendResult);
    });
  });

  describe('assertSelText', function() {
    beforeEach(function() {
      this.stubs.conjure.assertSelText.restore();
      this.restoreComponentRequire();
    });
    it('should use jQuery text()' , function() {
      this.conjure.assertSelText(this.sel, this.textNeedle);
      this.stubs.test.assertEquals.should.have.been.calledWithExactly(
        this.evaluateResult,
        this.textNeedle
      );
    });
    it('should support regex' , function() {
      this.conjure.assertSelText(this.sel, this.reNeedle);
      this.stubs.test.assertMatch.should.have.been.calledWithExactly(
        this.evaluateResult,
        this.reNeedle
      );
    });
  });

  describe('assertType', function() {
    beforeEach(function() {
      this.stubs.conjure.assertType.restore();
    });
    it('should use assertEquals()' , function() {
      this.conjure.assertType(this.sel, 'string');
      this.stubs.utils.betterTypeOf.should.have.been.calledWithExactly(this.sel);
      this.stubs.utils.format.should.have.been.calledWithExactly(
        '%s should be a %s', 'subject', 'string'
      );
      this.stubs.test.assertEquals.should.have.been.calledWithExactly(
        this.betterTypeOf,
        'string',
        this.format
      );
    });
    it('should apply custom subject label' , function() {
      var subject = 'testString';
      this.conjure.assertType(this.sel, 'string', subject);
      this.stubs.utils.format.should.have.been.calledWithExactly(
        '%s should be a %s', subject, 'string'
      );
    });
  });
});
