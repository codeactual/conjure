module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-shell');

  grunt.initConfig({
    jshint: {
      src: {
        files: {
          src: ['index.js', 'bootstrap.js']
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
          src: ['test/**/*.js']
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
      options: {
        failOnError: true
      },
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
        options: {
          stdout: true,
          stderr: true
        },
        command:
          'bin/conjure ' +
          '--server bin/test-server ' +
          '--root ' + __dirname + ' ' +
          '--bootstrap test/fixture/custom-bootstrap.js ' +
          '--grep should pass'
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'shell:shrinkwrap']);
  grunt.registerTask('build', ['shell:build']);
  grunt.registerTask('dist', ['shell:dist', 'uglify:dist']);
  grunt.registerTask('test_bin', ['build', 'shell:test_bin']);
};
