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
  args.unshift('--grep-file "^' + file + '\\.js"');

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

  detailedRun('empty-test', [], function(res) {
    res.output.should.match(/\/empty-test.js.*Did not call conjure.test\(\)/);
    res.code.should.equal(1);
  });

  detailedRun('context-props', '--timeout 10000');
  detailedRun('bootstrap', '--bootstrap test/fixture/custom-bootstrap.js');
  detailedRun('grep-case', '--grep-case should only run this');
  detailedRun('grepv-case', '--grepv-case should prevent this from running');

  detailedRun('wait-status-on-timeout', [], function(res) {
    res.code.should.equal(1);
    res.output.should.match(/wait-status-on-timeout.js.*Auto-killed.*5000ms/);
    res.output.should.match(strSeqToRegex([
      ['should match'],
      ['selectorExists'],
      ['.selector-does-not-exist'],
      ['waitFor']
    ]));
  });

  detailedRun('flow', [], function(res) {
    res.code.should.equal(0);
    res.output.should.match(/path=bdd-flow integration,describe1,describe2,describe3,it1\n/);
  });

  detailedRun('stack-trace', [], function(res) {
    res.code.should.equal(1);
    res.output.should.not.contain('describe');
    res.output.should.match(strSeqToRegex([
      ['it', 'name', 'should trigger error']
    ]));
  });

  detailedRun('stack-trace', ['--full-trace'], function(res) {
    res.code.should.equal(1);
    res.output.should.match(strSeqToRegex([
      ['describe', 'name', 'initial selector'],
      ['\\|    ', 'it', 'name', 'should match'],
      ['\\|    \\|    ', 'selectorExists'],
      ['\\|    \\|    ', 'args', 'sel', 'body'],
      ['\\|    \\|    ', 'closure', 'type', 'waitFor'],
      ['\\|    \\|    ', 'closure', 'type', 'then'],
      ['describe', 'name', 'r1'],
      ['\\|    ', 'describe', 'name', 'd1'],
      ['\\|    \\|    ', 'it', 'name', 'i1'],
      ['\\|    ', 'describe', 'name', 'd2'],
      ['\\|    \\|    ', 'describe', 'name', 'd3'],
      ['\\|    \\|    \\|    ', 'describe', 'name', 'd4'],
      ['\\|    \\|    \\|    \\|    ', 'it', 'name', 'i2'],
      ['\\|    \\|    \\|    \\|    ', 'it', 'name', 'should trigger error']
    ]));
  });

  detailedRun('last-step', ['--full-trace'], function(res) {
    res.code.should.equal(1);
  });
});

/**
 * Build a regex that matches a sequence of sub-strings, with anything in between
 * them (e.g. terminal color codes), over a sequence of lines.
 *
 * @param {array} lines Each item is an array with a sequence of strings.
 * - Items represent expectations for a consecutive sequence of lines.
 * - Use empty strings to represent lines w/ no specific content expectation.
 * @return {regexp}
 */
function strSeqToRegex(lines) {
  var reStr = '';
  var linesLen = lines.length;

  lines.forEach(function(strSeq, idx) {
    strSeq.forEach(function(str) {
      if (str) { reStr += str + '.*'; }
    });
    if (idx < linesLen - 1) { reStr += '\\n.*'; }
  });

  return new RegExp(reStr, 'gm');
}
