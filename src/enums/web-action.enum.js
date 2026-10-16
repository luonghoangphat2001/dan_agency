'use strict';

/**
 * Web Automation Action Enum
 */
const WebAction = Object.freeze({
  CLICK: 'click',
  FILL: 'fill',
  WAIT: 'wait',

  values() {
    return [this.CLICK, this.FILL, this.WAIT];
  },
});

module.exports = WebAction;

