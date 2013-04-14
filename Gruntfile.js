module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-shell');

  grunt.initConfig({
    jshint: {
      src: {
        files: {
          src: ['index.js', 'bootstrap.js', 'lib/**/*.js']
        }
      },
      bin: {
        files: {
          src: ['bin/*']
        }
      },
      grunt: {
        files: {
          src: ['Gruntfile.js']
        }
      },
      tests: {
        options: {
          expr: true
        },
        files: {
          src: ['test/{mocha,casper}/*.js']
        }
      },
      json: {
        files: {
          src: ['*.json']
        }
      }
    },
    uglify: {
      dist: {
        options: {
          compress: false,
          mangle: false,
          beautify: true
        },
        files: {
          'dist/conjure.js': 'dist/conjure.js'
        }
      }
    },
    shell: {
      options: { failOnError: true },
      build: {
        command: 'component install --dev && component build --standalone conjure --name conjure --out dist --dev'
      },
      dist: {
        command: 'component build --standalone conjure --name conjure --out dist'
      },
      test_bin: {
        options: { stdout: true, stderr: true, failOnError: true },
        command: 'mocha --reporter tap --globals $,window test/mocha'
      }
    }
  });

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('build', ['default', 'shell:build']);
  grunt.registerTask('dist', ['default', 'shell:dist', 'uglify:dist']);
  grunt.registerTask('test_bin', ['build', 'shell:test_bin']);
};
