module.exports = function(grunt) {
  'use strict';

  require('grunt-horde')
    .create(grunt)
    .demand('initConfig.projName', 'conjure')
    .demand('initConfig.instanceName', 'conjure')
    .demand('initConfig.klassName', 'Conjure')
    .loot('node-component-grunt')
    .loot('node-lib-grunt')
    .loot('node-bin-grunt')
    .loot('./config/grunt')
    .attack();
};
