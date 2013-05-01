module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-shell');

  var mochaShelljsOpt = {stdout: true, stderr: false};

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
      shrinkwrap: {
        command: 'npm shrinkwrap'
      },
      test_bin: {
        options: mochaShelljsOpt,
        command: 'mocha --reporter tap --globals $,window test/mocha/bin.js'
      },
      test_helpers: {
        options: mochaShelljsOpt,
        command: 'mocha --reporter tap --globals $,window test/mocha/lib/conjure/helpers.js'
      },
      dox_lib: {
        command: 'gitemplate-dox --input lib/conjure/index.js --output docs/Conjure.md'
      }
    }
  });

  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('dox', ['shell:dox_lib']);
  grunt.registerTask('build', ['default', 'shell:build']);
  grunt.registerTask('dist', ['default', 'shell:dist', 'uglify:dist', 'shell:shrinkwrap', 'dox']);
  grunt.registerTask('test', ['build', 'shell:test_helpers', 'shell:test_bin']);
};
