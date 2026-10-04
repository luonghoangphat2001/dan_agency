'use strict';

/**
 * Multi-Agent Goal Conflict Type Enum
 */
const ConflictType = Object.freeze({
  CSKH_DISCOUNT_VS_CFO_MARGIN: 'CSKH_DISCOUNT_VS_CFO_MARGIN',
  OPS_STOCK_VS_CFO_CASH: 'OPS_STOCK_VS_CFO_CASH',
  RND_QUALITY_VS_LOGISTICS_COST: 'RND_QUALITY_VS_LOGISTICS_COST',
});

module.exports = ConflictType;
