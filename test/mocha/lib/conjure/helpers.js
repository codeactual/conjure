var sinon = require('sinon');
var chai = require('chai');

var should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

var conjure = require('../../../..');
var Conjure = conjure.Conjure;
var requireComponent = conjure.require;

require('sinon-doublist')(sinon, 'mocha');

describe('helpers', function() {
  'use strict';

  /**
   * Pack any remotely reusable boilerplate here to keep the actual tests
   * as small/clear as possible.
   */
  beforeEach(function() {
    this.stubs = {};
    addStubTargets.call(this);
    stubRequire.call(this);
    stubConjure.call(this);
    stubWindow.call(this);
    stubJQuery.call(this);
    addFixtures.call(this);
    stubUtilsApi.call(this);
    stubTestApi.call(this);
    stubCasperApi.call(this);
    stubThenMethods.call(this);
    stubMisc.call(this);
  });

  describe('click', function() {
    beforeEach(function() {
      this.stubs.casper.thenEvaluate.yields(this.sel);
      this.stubs.helper.click.restore();
      this.conjure.click(this.sel);
    });
    it('should wait for selector match', function() {
      this.stubs.helper.selectorExists.calledWithExactly(this.sel);
    });
    it('should use jQuery to click', function() {
      this.stubs.casper.thenEvaluate.should.be.called;
      this.stubs.$global.should.have.been.calledWithExactly(this.sel);
      this.stubs.$.click.should.have.been.called;
    });
  });

  describe('then', function() {
    beforeEach(function() {
      this.stubs.helper.then.restore();
      this.conjure.then(this.stubs.cb);
    });
    it('should inject context', function() {
      this.stubs.extend.should.have.been.calledWith(
        this.createdContext,
        {casper: this.conjure.casper, test: this.testApi}
      );
      this.stubs.cb.should.have.been.calledOn(this.extendResult);
    });
  });

  describe('assertSelText', function() {
    beforeEach(function() {
      this.stubs.helper.assertSelText.restore();
      this.restoreComponentRequire();
    });
    it('should use jQuery text()', function() {
      this.conjure.assertSelText(this.sel, this.textNeedle);
      this.stubs.test.assertEquals.should.have.been.calledWithExactly(
        this.evaluateResult,
        this.textNeedle
      );
    });
    it('should support regex', function() {
      this.conjure.assertSelText(this.sel, this.reNeedle);
      this.stubs.test.assertMatch.should.have.been.calledWithExactly(
        this.evaluateResult,
        this.reNeedle
      );
    });
  });

  describe('assertType', function() {
    beforeEach(function() {
      this.stubs.helper.assertType.restore();
    });
    it('should use assertEquals()', function() {
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
    it('should apply custom subject label', function() {
      var subject = 'testString';
      this.conjure.assertType(this.sel, 'string', subject);
      this.stubs.utils.format.should.have.been.calledWithExactly(
        '%s should be a %s', subject, 'string'
      );
    });
  });

  describe('each', function() {
    beforeEach(function() {
      this.stubs.helper.each.restore();
    });
    it('should invoke callback inside custom then()', function() {
      var self = this;
      this.conjure.each(this.strList, this.stubs.cb);
      this.stubs.cb.should.have.been.calledOn(this.thenContext);
      this.strList.forEach(function(item) {
        self.stubs.cb.should.have.been.calledWithExactly(item);
      });
    });
  });

  describe('openHash', function() {
    beforeEach(function() {
      this.stubs.helper.openHash.restore();
      this.hash = 'top';
      this.fullHash = '#' + this.hash;
      this.stubs.casper.thenEvaluate.yields(this.hash);
    });
    it('should update location hash', function() {
      this.conjure.openHash(this.hash);
      window.location.hash.should.equal(this.fullHash);
    });
    it('should optionally wait for a selector to exist', function() {
      this.conjure.openHash(this.hash, this.sel);
      this.stubs.helper.selectorExists.should.have.been.calledWithExactly(this.sel);
    });
  });

  describe('openInitUrl', function() {
    beforeEach(function() {
      this.stubs.helper.openInitUrl.restore();
      this.stubs.conjure.get.restore();
    });
    it('should use thenOpen()', function() {
      this.conjure.openInitUrl();
      this.stubs.casper.thenOpen.should.have.been.calledWithExactly(
        'http://localhost:8174/'
      );
    });
  });

  describe('require', function() {
    beforeEach(function() {
      this.stubs.helper.require.restore();
    });
    it('should detect local path', function() {
      var path = 'lib/sub/module.js';
      this.conjure.require('./' + path);
      this.stubs.requireCasper.should.have.been.calledWithExactly(
        this.cliApi.options.rootdir + '/' + path
      );
    });
    it('should detect casper module name', function() {
      this.conjure.require('utils');
      this.stubs.requireCasper.should.have.been.calledWithExactly('utils');
    });
  });

  describe('selectorExists', function() {
    beforeEach(function() {
      this.stubs.helper.selectorExists.restore();
    });
    it('should use jQuery', function() {
      this.stubs.casper.evaluate.yields(this.sel, 1);
      this.conjure.selectorExists(this.sel);
      this.stubs.casper.evaluate.should.have.been.calledWithExactly(
        sinon.match.func, this.sel, 1
      );
      this.stubs.$global.should.have.been.calledWithExactly(this.sel);
      this.stubs.test.assertTrue.should.have.been.calledWithExactly(
        true, 'exists: ' + this.sel
      );
    });
    it('should emit status event', function() {
      this.conjure.selectorExists(this.sel);
      this.stubs.conjure.status.should.have.been.calledWithExactly(
        'selectorExists', 'wait', {sel: this.sel, negate: undefined}
      );
    });
    it('should optionally negate expectation', function() {
      this.conjure.selectorExists(this.sel, true);
      this.stubs.casper.evaluate.should.have.been.calledWithExactly(
        sinon.match.func, this.sel, 0
      );
      this.stubs.test.assertTrue.should.have.been.calledWithExactly(
        true, 'missing: ' + this.sel
      );
    });
  });

  describe('selectorMissing', function() {
    beforeEach(function() {
      this.stubs.helper.selectorMissing.restore();
    });
    it('should use selectorExists()', function() {
      this.conjure.selectorMissing(this.sel);
      this.stubs.helper.selectorExists.should.have.been.calledWithExactly(this.sel, true);
    });
  });

  describe('sendKeys', function() {
    beforeEach(function() {
      this.stubs.helper.sendKeys.restore();
      this.conjure.sendKeys(this.sel, this.textNeedle);
    });
    it('should use selectorExists()', function() {
      this.stubs.helper.selectorExists.should.have.been.calledWithExactly(this.sel);
    });
    it('should use CasperJS sendKeys()', function() {
      this.stubs.casper.sendKeys.should.have.been.calledWithExactly(this.sel, this.textNeedle);
    });
  });

  describe('url', function() {
    beforeEach(function() {
      this.stubs.helper.url.restore();
      this.stubs.conjure.get.restore();
    });
    it('should append relative URL to base', function() {
      this.conjure.url(this.relUrl).should.equal('http://localhost:8174' + this.relUrl);
    });
  });
});

/**
 * Organize, and isolate from beforeEach(), for sanity.
 */

function addStubTargets() {
  this.testApi = {}; // CasperJS's this.test API
  this.utilsApi = {}; // CasperJS's this.utils API
  this.cliApi = { // CasperJS's CLI API
    options: {
      rootdir: '/path/to/proj'
    }
  };
  this.extendResult = {iAmA: 'extend() component'};
  this.createdContext = {iAmA: 'createdContext() return value'};
  this.requiredComponent = {iAmA: 'component-land require() return value'};
  this.evaluateResult = {iAmA: 'casper.evaluate() return value'};
  this.betterTypeOf = {iAmA: 'utils.betterTypeOf() return value'};
  this.format = {iAmA: 'utils.format() return value'};
}

function stubRequire() {
  // Stubbing CasperJS-land require(), ex. for colorizer module
  this.stubs.requiredComponentCreate = this.stubMany(
    this.requiredComponent, 'create'
  ).create;
  this.stubs.requireCasper = this.stub();
  this.stubs.requireCasper.returns(this.requiredComponent);

  this.stubs.extend = this.stub();
  this.stubs.extend.returns(this.extendResult);
  this.stubs.require = this.stub(conjure, 'require');
  this.stubs.require.withArgs('extend').returns(this.stubs.extend);
  conjure.setRequire(this.stubs.require);
  this.restoreComponentRequire = function() {
    conjure.setRequire(requireComponent);
  };
}

function stubConjure() {
  this.conjure = conjure.create(this.stubs.requireCasper);
  this.stubs.helper = this.stub(this.conjure.conjure);

  this.stubConfig = function(key, val) {
    this.stubs.conjure.get.withArgs(key).returns(val);
  };

  this.stubs.conjure = {
    get: this.stub(this.conjure, 'get')
  };
  this.stubConfig('cli', this.cliApi);
  this.stubConfig('requireCasper', this.stubs.requireCasper);

  this.stubs.conjure.status = this.stub(this.conjure, 'status');
}

function stubWindow() {
  GLOBAL.window = {
    location: {
      hash: ''
    }
  };
}

function stubJQuery() {
  // Use for stubs like: $(sel).<some method>().
  this.stubs.$result = {length: 0};

  // Use this.$stub to know what selector $ received.
  GLOBAL.$ = function() {};
  this.stubs.$global = this.stub(GLOBAL, '$').returns(this.stubs.$result);

  this.stubs.$ = this.stubMany(
    this.stubs.$result,
    [
      'click', 'text'
    ]
  );
}

function addFixtures() {
  this.sel = '.klass';
  this.textNeedle = 'foo';
  this.reNeedle = /foo/;
  this.stubs.cb = this.stub();
  this.strList = ['one', 'two', 'three'];
  this.relUrl = '/admin/settings';
}

function stubUtilsApi() {
  this.stubs.utils = this.stubMany(
    this.utilsApi,
    [
      'betterTypeOf', 'format'
    ]
  );
  this.stubs.utils.betterTypeOf.returns(this.betterTypeOf);
  this.stubs.utils.format.returns(this.format);
}

function stubTestApi() {
  this.stubs.test = this.stubMany(
    this.testApi,
    [
      'assertEquals', 'assertMatch', 'assertTrue'
    ]
  );
}

function stubCasperApi() {
  this.conjure.casper = {};
  this.stubs.casper = this.stubMany(
    this.conjure.casper,
    [
      'evaluate', 'sendKeys', 'then', 'thenEvaluate', 'thenOpen', 'waitFor'
    ]
  );
  this.stubs.casper.evaluate.returns(this.evaluateResult);
}

function stubThenMethods() {
  this.thenContext = {
    evaluate: this.stubs.casper.evaluate,
    sendKeys: this.stubs.casper.sendKeys,
    test: this.stubs.test,
    utils: this.stubs.utils
  };
  this.stubs.casper.then.yieldsOn(this.thenContext);
  this.stubs.casper.waitFor.yieldsOn(this.thenContext);
  this.stubs.helper.then.yieldsOn(this.thenContext);
}

function stubMisc() {
  this.stubs.createContext = this.stub(Conjure, 'createContext');
  this.stubs.createContext.returns(this.createdContext);
}
