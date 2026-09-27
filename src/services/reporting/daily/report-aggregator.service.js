/**
 * @fileoverview report-aggregator.service - Provides report-aggregator functionality.
 */
'use strict';

const localization = require('@lang');

/**
 * ReportAggregatorService
 * Manages report aggregator logic.
 */
class ReportAggregatorService {
  constructor({
    reporters,
    notificationGateway,
    timeoutMs = 5000,
  }) {
    this.reporters = reporters;
    this.notificationGateway = notificationGateway;
    this.timeoutMs = timeoutMs;
  }

  /**
   * aggregateAndNotify - Asynchronously executes aggregate and notify.
   * @param {*} reportDate - Input parameter.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async aggregateAndNotify({ reportDate, from, to }) {
    const reports = await Promise.all(this.reporters.map(
      (reporter) => this.#collect(reporter, { from, to })
    ));
    const degraded = reports.filter(({ status }) => status === 'degraded').length;
    const attention = reports.filter(({ status }) => status === 'attention').length;
    const message = this.#format(reportDate, reports);

    const receipt = await this.notificationGateway.notify({
      idempotencyKey: `daily-agent-report:${reportDate}`,
      title: localization.t('reporting.daily.title', { reportDate }),
      message,
      severity: degraded > 0 || attention > 0 ? 'warning' : 'success',
    });

    return Object.freeze({ reportDate, reports: Object.freeze(reports), receipt });
  }

  async #collect(reporter, period) {
    try {
      return await this.#withTimeout(
        reporter.report(period),
        reporter.agent.id,
      );
    } catch (error) {
      return Object.freeze({
        agentId: reporter.agent.id,
        department: reporter.agent.department,
        status: 'degraded',
        errorCode: error.code || 'daily_report_failed',
      });
    }
  }

  #withTimeout(promise, agentId) {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`Daily report timed out for ${agentId}`);
        error.code = 'daily_report_timeout';
        reject(error);
      }, this.timeoutMs);
    });
    return Promise.race([Promise.resolve(promise), timeout])
      .finally(() => clearTimeout(timer));
  }

  #format(reportDate, reports) {
    const dataDateLabel = localization.t('reporting.daily.data_date');
    const lines = [`${dataDateLabel}: **${reportDate}**`, ''];
    reports.forEach((report) => {
      if (report.status === 'degraded') {
        const degradedMessage = localization.t('reporting.daily.degraded_report', { errorCode: report.errorCode });
        lines.push(`⚠️ **${report.agentId}**: ${degradedMessage}`);
        return;
      }
      const icon = report.status === 'attention' ? '⚠️' : '✅';
      const metrics = report.metrics;
      const completedLabel = localization.t('reporting.daily.completed');
      const failedLabel = localization.t('reporting.daily.failed');
      const awaitingApprovalLabel = localization.t('reporting.daily.awaiting_approval');
      const actionLabel = localization.t('reporting.daily.action');
      lines.push(
        `${icon} **${report.agentId}**: ${metrics.workflowCount} workflow · `
        + `${metrics.completedCount} ${completedLabel} · ${metrics.failedCount} ${failedLabel} · `
        + `${metrics.awaitingApprovalCount} ${awaitingApprovalLabel} · ${metrics.actionCount} ${actionLabel}`
      );
    });
    return lines.join('\n');
  }
}

module.exports = ReportAggregatorService;
