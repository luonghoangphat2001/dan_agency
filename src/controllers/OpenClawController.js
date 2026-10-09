'use strict';

class OpenClawController {
  #service;

  /** @param {import('../services/OpenClawMonitorService')} service */
  constructor(service) {
    this.#service = service;
    this.list   = this.list.bind(this);
    this.overview = this.overview.bind(this);
    this.agents = this.agents.bind(this);
    this.controlAgent = this.controlAgent.bind(this);
    this.workflows = this.workflows.bind(this);
    this.workflowDetail = this.workflowDetail.bind(this);
  }

  async overview(_req, res) {
    const result = await this.#service.getOverview();
    res.json(result);
  }

  async agents(_req, res) {
    const result = await this.#service.getAgents();
    res.json(result);
  }

  async controlAgent(req, res) {
    const result = await this.#service.controlAgent({
      agentId: req.params.agentId,
      toState: req.body?.toState,
      expectedVersion: req.body?.expectedVersion,
      reason: req.body?.reason,
    });
    res.json(result);
  }

  async workflows(req, res) {
    const result = await this.#service.getWorkflows({
      limit: req.query.limit,
      offset: req.query.offset,
      agentId: req.query.agentId,
      state: req.query.state,
      search: req.query.search,
    });
    res.json(result);
  }

  async workflowDetail(req, res) {
    const result = await this.#service.getWorkflowDetail(req.params.workflowId);
    res.json(result);
  }

  async list(req, res) {
    const PaginationUtils = require('@utils/PaginationUtils');
    const { limit, offset } = PaginationUtils.parse(req.query, { defaultLimit: 50, maxLimit: 200 });
    res.json(await this.#service.listInteractions(limit, offset));
  }
}

module.exports = OpenClawController;
