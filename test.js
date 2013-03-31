var sinon = require('sinon');
var chai = require('chai');
var shelljs = require('shelljs');
var fs = require('fs');
var util = require('util');
var sprintf = util.format;

var should = chai.should();
chai.Assertion.includeStack = true;
chai.use(require('sinon-chai'));

var parapsych = require('./dist/parapsych');
var Parapsych = parapsych.Parapsych;
var requireComponent = parapsych.require;

requireComponent('sinon-doublist')(sinon, 'mocha');
requireComponent('sinon-doublist-fs')(fs, 'mocha');

describe('parapsych', function() {
  describe('Parapsych', function() {
    beforeEach(function() {
      this.parapsych = new Parapsych();
      this.parapsych
        .set('something', 'something else')
        .set('nativeRequire', require)
        .init();

      this.resOK = {code: 0};
    });

    it('should do something', function() {
      console.log('\x1B[33m<---------- INCOMPLETE');
    });
  });
});
