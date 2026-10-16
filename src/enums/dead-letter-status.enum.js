'use strict';

/**
 * Dead Letter Status Enum
 */
const DeadLetterStatus = Object.freeze({
  OPEN: 'open',
  RESOLVED: 'resolved',
  REPLAYED: 'replayed',
  IGNORED: 'ignored',

  values() {
    return [this.OPEN, this.RESOLVED, this.REPLAYED, this.IGNORED];
  },
});

module.exports = DeadLetterStatus;

