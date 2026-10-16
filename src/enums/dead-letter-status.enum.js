'use strict';

/**
 * Dead Letter Status Enum
 */
const DeadLetterStatus = Object.freeze({
  OPEN: 'open',
  RESOLVED: 'resolved',
  REPLAYED: 'replayed',
  IGNORED: 'ignored',
});

module.exports = DeadLetterStatus;
