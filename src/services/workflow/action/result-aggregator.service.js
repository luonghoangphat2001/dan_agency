/**
 * @fileoverview result-aggregator.service - Provides result-aggregator functionality.
 */
'use strict';

const { TaskStatus, TaskAggregateStatus } = require('@enums');

/**
 * ResultAggregatorService
 * Manages result aggregator logic.
 */
class ResultAggregatorService {
  /**
   * aggregate - Executes aggregate.
   * @param {*} graph - Input parameter.
   * @param {*} resultMap - Input parameter.
   * @returns {*} Result of operation.
   */
  aggregate(graph, resultMap) {
    const tasks = graph.list().map((task) => {
      const result = resultMap.get(task.id) || {
        status: TaskStatus.SKIPPED,
        error: { code: 'task_not_executed' },
      };
      return Object.freeze({
        taskId: task.id,
        key: task.key,
        agentId: task.assignedAgentId,
        ...result,
      });
    });
    const succeeded = tasks.filter(({ status }) => status === TaskStatus.COMPLETED).length;
    const failed = tasks.filter(({ status }) => status === TaskStatus.FAILED).length;
    const skipped = tasks.filter(({ status }) => status === TaskStatus.SKIPPED).length;
    const status = succeeded === tasks.length
      ? TaskAggregateStatus.COMPLETED
      : succeeded > 0
        ? TaskAggregateStatus.PARTIAL
        : TaskAggregateStatus.FAILED;


    return Object.freeze({
      status,
      summary: Object.freeze({
        total: tasks.length,
        succeeded,
        failed,
        skipped,
      }),
      tasks: Object.freeze(tasks),
    });
  }
}

module.exports = ResultAggregatorService;
