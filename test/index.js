var chai = require('chai');
var exec = require('shelljs').exec;
var util = require('util');
var sprintf = util.format;

var should = chai.should();
chai.Assertion.includeStack = true;

var baseConjureCmd =
  'bin/conjure ' +
    '--server bin/test-server ' +
    '--root-dir ' + __dirname + '/../ ' +
    '--verbose ';
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
    exec(
      baseConjureCmd +
      '--grep-file "^' + file + '\\.js$" '
    ).code.should.equal(0);
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
      exec(baseConjureCmd + args.join(' ')).code.should.equal(0);
    });
  }
}

describe('/bin/conjure', function() {
  var basicTestFiles = ['flow'];
  basicTestFiles.forEach(function(file) {
    basicRun(file);
  });

  detailedRun('^empty-test\\.js$', [], function(res) {
    res.output.should.match(/\/empty-test.js:.*Did not call conjure.test\(\)/);
    res.code.should.equal(1);
  });

  detailedRun('^bootstrap\\.js$', '--bootstrap test/fixture/custom-bootstrap.js');
  detailedRun('^grepv-case\\.js$', '--grepv-case should prevent this from running');

  detailedRun('^wait-status-on-timeout\\.js$', [], function(res) {
    res.code.should.equal(1);
    res.output.should.match(/Auto-killed.*wait-status-on-timeout.js/);
    res.output.should.match(
      /Potential timeout reason.*selector-does-not-exist.*selectorExists/
    );
  });
});
