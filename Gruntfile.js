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
          src: ['test.js']
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
        command: 'component install --dev && component build --standalone Parapsych --name parapsych --out dist --dev'
      },
      dist: {
        command: 'component build --standalone Parapsych --name parapsych --out dist'
      },
      shrinkwrap: {
        command: 'npm shrinkwrap'
      }
    }
  });

  grunt.registerTask('default', ['jshint', 'shell:shrinkwrap']);
  grunt.registerTask('build', ['shell:build']);
  grunt.registerTask('dist', ['shell:dist', 'uglify:dist']);
};
