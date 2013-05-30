module.exports = function(grunt) {
  'use strict';

  return {
    test_bin: {
      options: this.learn('mochaShelljsOpt'),
      command: 'mocha --reporter tap --globals $,window test/mocha/bin.js'
    },
    test_helpers: {
      options: this.learn('mochaShelljsOpt'),
      command: 'mocha --reporter tap --globals $,window test/mocha/lib/conjure/helpers.js'
    },
    dox_lib: {
      command: 'apidox --input lib/conjure/index.js --output docs/Conjure.md'
    },
    dox_cli_process: {
      command: 'apidox --input lib/cli/conjure/process.js --output docs/Process.md'
    },
    dox_cli_process_batch: {
      command: 'apidox --input lib/cli/conjure/process-batch.js --output docs/ProcessBatch.md'
    },
    dox_cli_process_data: {
      command: 'apidox --input lib/cli/conjure/process-data.js --output docs/ProcessData.md'
    },
    dox_cli_status: {
      command: 'apidox --input lib/cli/conjure/status.js --output docs/Status.md'
    },
    dox_cli_status_list: {
      command: 'apidox --input lib/cli/conjure/status-list.js --output docs/StatusList.md'
    }
  };
};
