const gulp = require('gulp');
const core = require('./node_modules/core/gulp_helper');
const pkg = require('./package.json');

core.embeddedApp.createTasks(gulp, {
  pkg,
  embedArea: 'full',
  environmentOverride: null,
  deploymentPath: '/webapps/corejs/feature/dropzone',
  preprocessorContext: {
    local: {},
    dev: {},
    qa: {},
    prod: {}
  }
});
