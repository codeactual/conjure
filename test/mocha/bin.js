var chai = require('chai');
var exec = require('shelljs').exec;
var util = require('util');
var sprintf = util.format;

var should = chai.should();
chai.Assertion.includeStack = true;

var baseConjureCmd = [
  'bin/conjure',
  '--server ' + __dirname + '/../../bin/test-server',
  '--root-dir ' + __dirname + '/../..',
  '--test-dir test/casper',
  '--verbose'
].join(' ') + ' ';
var baseConjureOpt = {stdout: true, stderr: true, failOnError: false};

function itShouldRunCasperWith(file, cb) {
  var expectation;
  if (typeof file === 'string') {
    expectation = 'should run test/' + file + '.js';
  } else {
    expectation = 'should run test/ files matching ' + file;
  }
  it(expectation, cb);
}

function basicRun(file) {
  itShouldRunCasperWith(file, function() {
    var res = exec(
      baseConjureCmd +
      '--grep-file "^' + file + '\\.js$" '
    );
    res.code.should.equal(0);
    res.output.trim().should.not.equal('');
  });
}

function detailedRun(file, args, cb) {
  args = [].concat(args);
  args.unshift('--grep-file "' + file + '"');

  if (cb) {
    itShouldRunCasperWith(file, function() {
      cb(exec(baseConjureCmd + args.join(' ')));
    });
  } else {
    itShouldRunCasperWith(file, function() {
      var res = exec(baseConjureCmd + args.join(' '));
      res.code.should.equal(0);
      res.output.trim().should.not.equal('');
    });
  }
}

describe('/bin/conjure', function() {
  var basicTestFiles = [];
  basicTestFiles.forEach(function(file) {
    basicRun(file);
  });

  detailedRun('^empty-test\\.js$', [], function(res) {
    res.output.should.match(/\/empty-test.js.*Did not call conjure.test\(\)/);
    res.code.should.equal(1);
  });

  detailedRun('^context-props\\.js$', '--timeout 8000');
  detailedRun('^bootstrap\\.js$', '--bootstrap test/fixture/custom-bootstrap.js');
  detailedRun('^grep-case\\.js$', '--grep-case should only run this');
  detailedRun('^grepv-case\\.js$', '--grepv-case should prevent this from running');

  detailedRun('^wait-status-on-timeout\\.js$', [], function(res) {
    res.code.should.equal(1);
    res.output.should.match(/wait-status-on-timeout.js.*Auto-killed.*5000ms/);
    res.output.should.match(
      /selectorExists.*waitFor.*\n.*\n.*selector-does-not-exist/gm
    );
  });

  detailedRun('^flow\\.js$', [], function(res) {
    res.code.should.equal(0);
    res.output.should.match(/path=bdd-flow integration,describe1,describe2,describe3,it1\n/);
  });
});
