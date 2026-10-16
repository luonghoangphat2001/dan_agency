/**
 * @fileoverview ApprovalController - Provides approval functionality.
 */
'use strict';

const BaseController = require('@controllers/BaseController');

/**
 * ApprovalController
 * Manages approval logic.
 */
class ApprovalController extends BaseController {
  /**
   * constructor - Executes constructor.
   * @param {*} service - Input parameter.
   * @returns {*} Result of operation.
   */
  constructor(service, bulkService = null) {
    super();
    this.service = service;
    this.approvalService = service;
    this.bulkService = bulkService;
  }

  /**
   * decide - Asynchronously executes decide.
   * @param {import('express').Request} req - Express request object.
   * @param {import('express').Response} res - Express response object.
   * @returns {*} Promise resolving result.
   */
  async decide(req, res) {
    const actorId = req.user?.id || req.user?.sub || req.body?.actorId;
    const approval = await this.service.decide({
      approvalId: req.params.approvalId,
      decision: req.body?.decision,
      decisionVersion: req.body?.decisionVersion,
      actorId,
      reason: req.body?.reason,
    });
    return this.ok(res, { approval });
  }
}

module.exports = ApprovalController;
