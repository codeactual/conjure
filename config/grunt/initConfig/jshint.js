module.exports = function() {
  'use strict';

  var srcFiles = this.learn('jshint.src.files.src'); // Add bootstrap.js
  this.demand('jshint.src.files.src', srcFiles.concat('bootstrap.js'));

  return {
    config: {
      files: {
        src: ['config/**/*.js']
      }
    },
    tests: {
      options: {
        expr: true
      },
      files: {
        src: ['test/{casper,mocha}/*.js']
      }
    }
  };
};
