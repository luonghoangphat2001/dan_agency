/**
 * @fileoverview rnd.agent - Provides rnd.agent functionality.
 */
'use strict';

const BaseProposalAgent = require('@services/ai/agents/base-proposal.agent');
const MenuAnalysisService = require('@services/ai/agents/rnd/menu-analysis.service');
const localization = require('@lang');

/**
 * RndAgent
 * Manages rnd agent logic.
 */
class RndAgent extends BaseProposalAgent {
  constructor({
    readAdapter,
    analyzer = new MenuAnalysisService(),
    idFactory,
    clock,
  }) {
    super({
      agentId: 'dan_rnd',
      proposalTypes: ['menu_review'],
      idFactory,
      clock,
    });
    this.readAdapter = readAdapter;
    this.analyzer = analyzer;
  }

  /**
   * execute - Asynchronously executes execute.
   * @param {*} workflowId - Input parameter.
   * @param {*} query - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async execute({ workflowId, query = {} }) {
    const productResult = await this.readAdapter.listProducts(query);
    const analysis = this.analyzer.analyze(productResult.data);
    const candidates = analysis.filter(({ signals }) => signals.length > 0);

    return this.createProposal({
      workflowId,
      type: 'menu_review',
      summary: localization.t('agents.rnd.product_review_summary', { candidatesCount: candidates.length, analysisCount: analysis.length }),
      evidence: analysis.map((item) => ({
        source_ref: `product:${item.product_id}`,
        ...item,
      })),
      recommendations: candidates.map((item) => ({
        product_id: item.product_id,
        recommendation: 'review_menu_item',
        reasons: item.signals,
      })),
      requestedActions: [],
    });
  }
}

module.exports = RndAgent;
