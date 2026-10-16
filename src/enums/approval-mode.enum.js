'use strict';

/**
 * Approval Mode Enum
 */
const ApprovalMode = Object.freeze({
  NEVER: 'never',
  CONDITIONAL: 'conditional',
  ALWAYS: 'always',

  values() {
    return [this.NEVER, this.CONDITIONAL, this.ALWAYS];
  },
});

module.exports = ApprovalMode;

