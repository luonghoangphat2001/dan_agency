'use strict';

/**
 * Policy Decision Enum
 */
const PolicyDecision = Object.freeze({
  ALLOW: 'allow',
  REQUIRE_APPROVAL: 'require_approval',
  DENY: 'deny',

  values() {
    return [this.ALLOW, this.REQUIRE_APPROVAL, this.DENY];
  },
});

module.exports = PolicyDecision;

