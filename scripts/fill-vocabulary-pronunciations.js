'use strict';

// Forwarding wrapper to database maintenance layer
require('module-alias/register');
module.exports = require('@database/maintenance/fill-vocabulary-pronunciations');
