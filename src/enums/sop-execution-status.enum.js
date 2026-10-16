'use strict';

/**
 * Sop Execution Status Enum
 */
const SopExecutionStatus = Object.freeze({
  COMPLETED: 'COMPLETED',
  INCOMPLETE: 'INCOMPLETE',
  BLOCKED_PRECONDITION_FAILED: 'BLOCKED_PRECONDITION_FAILED',

  values() {
    return [this.COMPLETED, this.INCOMPLETE, this.BLOCKED_PRECONDITION_FAILED];
  },
});

module.exports = SopExecutionStatus;

