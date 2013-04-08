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

  describe('andClick', function() {
    it('should' , function() {
    });
  });
});
