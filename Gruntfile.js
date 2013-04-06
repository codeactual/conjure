module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-shell');

  var baseConjureCmd =
    'bin/conjure ' +
      '--server bin/test-server ' +
      '--root-dir ' + __dirname + ' ' +
      '--verbose ';
  var baseConjureOpt = {
    stdout: true,
    stderr: true
  };

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
      test_bootstrap: {
        options: baseConjureOpt,
        command:
          baseConjureCmd +
          '--bootstrap test/fixture/custom-bootstrap.js ' +
          '--grep-file "^bootstrap\\.js$" '
      },
      test_flow: {
        options: baseConjureOpt,
        command:
          baseConjureCmd +
          '--grep-file "^flow\\.js$" '
      },
      test_grepv_case: {
        options: baseConjureOpt,
        command:
          baseConjureCmd +
          '--grep-file "^grepv-case\\.js$" ' +
          '--grepv-case should prevent this from running'
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'shell:shrinkwrap']);
  grunt.registerTask('build', ['shell:build']);
  grunt.registerTask('dist', ['shell:dist', 'uglify:dist']);
  grunt.registerTask('test_bin', [
    'build',
    'shell:test_bootstrap',
    'shell:test_flow',
    'shell:test_grepv_case'
  ]);
};
