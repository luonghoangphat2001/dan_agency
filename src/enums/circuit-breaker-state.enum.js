'use strict';

/**
 * Circuit Breaker State Enum
 */
const CircuitBreakerState = Object.freeze({
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open',

  values() {
    return [this.CLOSED, this.OPEN, this.HALF_OPEN];
  },
});

module.exports = CircuitBreakerState;

