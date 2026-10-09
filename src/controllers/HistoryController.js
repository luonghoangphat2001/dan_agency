'use strict';

const PaginationUtils = require('@utils/PaginationUtils');

/**
 * Returns paginated conversation history (admin only).
 */
class HistoryController {
  /** @type {import('../models/ConversationRepository')} */
  #conversationRepo;

  /** @param {import('../models/ConversationRepository')} conversationRepo */
  constructor(conversationRepo) {
    this.#conversationRepo = conversationRepo;
    this.get = this.get.bind(this);
  }

  async get(req, res) {
    const { limit, offset } = PaginationUtils.parse(req.query, { defaultLimit: 50, maxLimit: 200 });
    res.json(await this.#conversationRepo.findAll(limit, offset));
  }
}

module.exports = HistoryController;
