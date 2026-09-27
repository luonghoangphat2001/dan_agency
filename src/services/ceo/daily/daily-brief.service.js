/**
 * @fileoverview daily-brief.service - Provides daily-brief functionality.
 */
'use strict';

const localization = require('@lang');

/**
 * DailyBriefService
 * Manages daily brief logic.
 */
class DailyBriefService {
  constructor({
    repository,
    financeProvider,
    notificationGateway,
    sectionTimeoutMs = 5000,
  }) {
    this.repository = repository;
    this.financeProvider = financeProvider;
    this.notificationGateway = notificationGateway;
    this.sectionTimeoutMs = sectionTimeoutMs;
  }

  /**
   * generate - Asynchronously executes generate.
   * @param {*} reportDate - Input parameter.
   * @param {*} from - Input parameter.
   * @param {*} to - Input parameter.
   * @returns {*} Promise resolving result.
   */
  async generate({ reportDate, from, to }) {
    const collectors = {
      goals: () => this.repository.goalSnapshot(),
      kpis: () => this.repository.kpiSnapshot(from, to),
      finance: () => this.financeProvider.getFinanceSummary('day'),
      risks: () => this.repository.exceptionSnapshot(),
      decisions: () => this.repository.approvalSnapshot(),
      completed: () => this.repository.completedSnapshot(from, to),
    };
    const entries = await Promise.all(Object.entries(collectors).map(
      async ([name, collect]) => {
        try {
          return [name, await this.#timeout(collect(), name)];
        } catch (error) {
          return [name, { degraded: true, errorCode: error.code || 'section_failed' }];
        }
      }
    ));
    const sections = Object.freeze(Object.fromEntries(entries));
    const degraded = entries.some(([, value]) => value.degraded);
    const message = this.#format(reportDate, sections);
    const receipt = await this.notificationGateway.notify({
      idempotencyKey: `ceo-daily-brief:${reportDate}`,
      title: localization.t('ceo.daily_brief.title', { reportDate }),
      message,
      severity: degraded || Number(sections.risks?.critical || 0) > 0
        ? 'warning'
        : 'success',
    });
    return Object.freeze({ reportDate, sections, receipt });
  }

  #format(date, sections) {
    const value = (section, fallback = 'degraded') =>
      section?.degraded ? fallback : JSON.stringify(section);
    return [
      `📅 **${localization.t('ceo.daily_brief.section_date')}:** ${date}`,
      `🎯 **${localization.t('ceo.daily_brief.section_goals')}:** ${value(sections.goals)}`,
      `📊 **${localization.t('ceo.daily_brief.section_kpis')}:** ${value(sections.kpis)}`,
      `💰 **${localization.t('ceo.daily_brief.section_finance')}:** ${value(sections.finance?.data || sections.finance)}`,
      `⚠️ **${localization.t('ceo.daily_brief.section_risks')}:** ${value(sections.risks)}`,
      `🧑‍⚖️ **${localization.t('ceo.daily_brief.section_decisions')}:** ${value(sections.decisions)}`,
      `✅ **${localization.t('ceo.daily_brief.section_completed')}:** ${value(sections.completed)}`,
    ].join('\n');
  }

  #timeout(promise, section) {
    let timer;
    const deadline = new Promise((_resolve, reject) => {
      timer = setTimeout(() => {
        const error = new Error(`CEO brief section timed out: ${section}`);
        error.code = 'brief_section_timeout';
        reject(error);
      }, this.sectionTimeoutMs);
    });
    return Promise.race([Promise.resolve(promise), deadline])
      .finally(() => clearTimeout(timer));
  }
}

module.exports = DailyBriefService;
