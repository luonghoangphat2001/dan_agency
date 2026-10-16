'use strict';

class TaskController {
  /** @type {import('../models/TaskRepository')} */
  #taskRepo;

  /** @param {import('../models/TaskRepository')} taskRepo */
  constructor(taskRepo) {
    if (!taskRepo) {
      throw new TypeError('[TaskController] taskRepo dependency is required');
    }
    this.#taskRepo = taskRepo;
    this.list = this.list.bind(this);
    this.get = this.get.bind(this);
  }

  async list(req, res) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      res.json({ tasks: await this.#taskRepo.findAll(limit) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async get(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid task id' });
      const task = await this.#taskRepo.findOne(id);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      res.json({ task });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = TaskController;
