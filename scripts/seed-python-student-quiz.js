'use strict';

// Forwarding wrapper to database seeder layer
require('module-alias/register');
const seeder = require('@database/seeders/content/seed-python-student-quiz');

if (require.main === module) {
  seeder.main().catch((err) => {
    console.error('[Seed Error]:', err.message);
    process.exitCode = 1;
  });
}

module.exports = seeder;
