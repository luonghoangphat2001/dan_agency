'use strict';

require('module-alias/register');
const Server = require('@server');

new Server().start().catch((error) => {
  console.error(`[OpenClaw] Startup failed: ${error.message}`);
  process.exitCode = 1;
});
