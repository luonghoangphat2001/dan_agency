'use strict';

// Forwarding wrapper to database maintenance layer
require('module-alias/register');
module.exports = require('@database/maintenance/repair-vocabulary-topic-37');
