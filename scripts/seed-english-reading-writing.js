'use strict';

// Forwarding wrapper to database seeder layer
require('module-alias/register');
const seeder = require('@database/seeders/content/seed-english-reading-writing');

if (require.main === module) {
  seeder.main().catch((err) => {
    console.error(err.stack || err.message);
    process.exit(1);
  });
}

module.exports = seeder;
