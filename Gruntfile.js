module.exports = function(grunt) {
  'use strict';

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-shell');

  grunt.initConfig({
    jshint: {
      src: {
        files: {
          src: ['index.js']
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
          src: ['test/*.js']
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
          'dist/parapsych.js': 'dist/parapsych.js'
        }
      }
    },
    shell: {
      options: {
        failOnError: true
      },
      build: {
        command: 'component install --dev && component build --standalone parapsych --name parapsych --out dist --dev'
      },
      dist: {
        command: 'component build --standalone parapsych --name parapsych --out dist'
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
          'bin/parapsych ' +
          '--server bin/test-server ' +
          '--pid /tmp/parapsych-test-server.pid ' +
          '--root ' + __dirname + ' ' +
          '--file bin.js ' +
          '--grep should pass'
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'shell:shrinkwrap']);
  grunt.registerTask('build', ['shell:build']);
  grunt.registerTask('dist', ['shell:dist', 'uglify:dist']);
  grunt.registerTask('test_bin', ['build', 'shell:test_bin']);
};
