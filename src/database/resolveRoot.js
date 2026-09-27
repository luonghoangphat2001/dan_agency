'use strict';

/**
 * @fileoverview resolveRoot - Shared project root resolver for database scripts.
 *
 * Standalone database scripts (migrations, seeders, maintenance, cleanup) must run
 * independently before module-alias is bootstrapped. They cannot use '@config' or
 * '@utils' aliases at the top of the file to locate .env.
 *
 * This module resolves the project root by walking upward until it finds package.json,
 * so scripts are not tied to a specific number of '../' hops and remain refactor-safe
 * when moved to a different directory depth.
 *
 * Usage in standalone scripts (must be the very first require):
 *
 *   require('module-alias/register');
 *   const { rootDir, initEnv } = require('@database/resolveRoot');
 *   initEnv();                        // loads .env and module-alias
 *   // Now @services, @models, @utils, @database etc. are available
 *
 * @module database/resolveRoot
 */

const path = require('path');
const fs = require('fs');

/**
 * Walk upward from `startDir` until `package.json` is found.
 * Returns the directory containing package.json (project root).
 *
 * @param {string} startDir
 * @returns {string}
 */
function findProjectRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `[resolveRoot] Could not locate package.json starting from: ${startDir}`
  );
}

const rootDir = findProjectRoot(__dirname);

/**
 * Bootstrap module-alias and dotenv using the resolved project root.
 * Safe to call multiple times — dotenv.config() is idempotent, module-alias
 * caches registrations internally.
 */
function initEnv() {
  require('dotenv').config({ path: path.join(rootDir, '.env') });
  require('module-alias')(rootDir);
}

module.exports = { rootDir, findProjectRoot, initEnv };
