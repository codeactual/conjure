module.exports = function(grunt) {
  'use strict';

  return {
    default: [['jshint']],
    dox: [['shell:dox_lib', 'dox_cli']],
    dox_cli: [['shell:dox_cli_process', 'shell:dox_cli_process_batch', 'shell:dox_cli_process_data', 'shell:dox_cli_status', 'shell:dox_cli_status_list']],
    build: [['default', 'shell:build']],
    dist: [['default', 'shell:dist', 'uglify:dist', 'dox']],
    test: [['build', 'shell:test_helpers', 'shell:test_bin']],
    test_travis: [['shell:build', 'shell:test_helpers', 'shell:test_bin']]
  };
};
