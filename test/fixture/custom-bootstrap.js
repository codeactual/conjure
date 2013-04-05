module.exports = function(conjure, testFile) {
  conjure.set('initSel', '.modified-by-custom-bootstrap');

  return [ // Test script should receive these as arguments.
    {prop1: 'first custom arg'},
    {prop2: 'second custom arg'},
    'this file: ' + testFile
  ];
};
