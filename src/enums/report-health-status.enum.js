'use strict';

/**
 * Report Health Status Enum
 */
const ReportHealthStatus = Object.freeze({
  HEALTHY: 'healthy',
  ATTENTION: 'attention',
  DEGRADED: 'degraded',

  values() {
    return [this.HEALTHY, this.ATTENTION, this.DEGRADED];
  },
});

module.exports = ReportHealthStatus;

