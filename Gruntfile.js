module.exports = function(grunt) {
  'use strict';

  require('grunt-horde')
    .create(grunt)
    .demand('projName', 'conjure')
    .demand('instanceName', 'conjure')
    .demand('klassName', 'Conjure')
    .loot('node-component-grunt')
    .loot('node-bin-grunt')
    .loot('./config/grunt')
    .attack();
};
