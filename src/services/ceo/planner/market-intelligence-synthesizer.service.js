/**
 * @fileoverview market-intelligence-synthesizer.service.js
 * OpenClaw Market Intelligence & Autonomous Web Radar
 * Connects with OpenClaw Crawler/Scraper to synthesize competitor intelligence,
 * price tracking, keyword trends, and disruption alerts into CEO-ready executive insights.
 */
'use strict';

const crypto = require('crypto');
const DomainAgent = require('@enums/domain-agent.enum');
const ThreatType = require('@enums/threat-type.enum');
const ThreatSeverity = require('@enums/threat-severity.enum');
const PositioningStatus = require('@enums/positioning-status.enum');
const UrgencyLevel = require('@enums/urgency-level.enum');
const SentimentType = require('@enums/sentiment-type.enum');

class MarketIntelligenceSynthesizerService {
  constructor({ openClawCrawler = null, clock = () => new Date(), rules = null } = {}) {
    this.openClawCrawler = openClawCrawler;
    this.clock = clock;
    this.intelStore = new Map();
    this.rules = rules || this.#loadRules();
  }

  #loadRules() {
    try {
      return require('@skills/market-analysis/rules.json');
    } catch (_) {}
    return {
      priceRecommendations: {},
      negativeSentimentOpportunityTemplate: '',
      strategicTakeaways: {},
      threatEvidenceTemplates: {},
      pricingResponseRecommendation: '',
      rndTaskTemplate: '',
      rndDeliverables: [],
    };
  }

  /**
   * Synthesizes competitor prices and performs price gap analysis (Competitor Price Tracking & Gap Analysis)
   */
  synthesizeCompetitorPrices(crawledData = []) {
    const analysis = crawledData.map(item => {
      const internalPrice = item.internalPrice || 0;
      const competitorPrice = item.competitorPrice || 0;
      const priceGap = competitorPrice - internalPrice;
      const priceGapPct = internalPrice > 0 ? ((priceGap / internalPrice) * 100).toFixed(1) : 0;

      let positioning = PositioningStatus.COMPETITIVE_EQUAL;
      if (priceGap > 2000) positioning = PositioningStatus.WE_ARE_CHEAPER;
      else if (priceGap < -2000) positioning = PositioningStatus.WE_ARE_PREMIUM;

      return {
        sku: item.sku,
        productName: item.productName,
        internalPrice,
        competitorPrice,
        priceGap,
        priceGapPct: `${priceGapPct}%`,
        positioning,
      };
    });

    const averageGap = analysis.reduce((sum, i) => sum + i.priceGap, 0) / (analysis.length || 1);

    const priceRecs = this.rules.priceRecommendations || {};

    return {
      totalItemsCompared: analysis.length,
      averagePriceGapVND: Math.round(averageGap),
      items: analysis,
      recommendation: averageGap < -2000
        ? (priceRecs.competitorCheaper || '')
        : (priceRecs.weAreCompetitive || ''),
      analyzedAt: this.clock().toISOString(),
    };
  }

  /**
   * Detects keyword trends and disruption signals (Trend Radar & Disruption Alert)
   */
  detectEmergingTrends(crawledKeywords = [], sentimentRecords = []) {
    const alertId = `radar_${crypto.randomUUID().substring(0, 8)}`;

    const risingTrends = crawledKeywords
      .filter(k => (k.growthRate || 0) >= 0.40)
      .sort((a, b) => (b.growthRate || 0) - (a.growthRate || 0));

    const opportunityTemplate = this.rules.negativeSentimentOpportunityTemplate || '';

    const negativeSentimentsOnCompetitors = sentimentRecords
      .filter(s => s.sentiment === SentimentType.NEGATIVE && s.mentionCount >= 5)
      .map(s => ({
        competitorName: s.competitorName,
        painPoint: s.topic,
        opportunity: opportunityTemplate.replace('{topic}', s.topic),
      }));

    const isDisruption = risingTrends.some(t => t.growthRate >= 1.0);
    const takeaways = this.rules.strategicTakeaways || {};

    return {
      alertId,
      disruptionAlert: isDisruption,
      urgency: isDisruption ? UrgencyLevel.RED_IMMEDIATE : UrgencyLevel.YELLOW_MONITOR,
      topTrends: risingTrends.slice(0, 5),
      competitorWeaknesses: negativeSentimentsOnCompetitors,
      strategicTakeaway: isDisruption
        ? (takeaways.disruptionAlert || '')
        : (takeaways.stableMarket || ''),
      timestamp: this.clock().toISOString(),
    };
  }

  /**
   * Analyzes competitor threats (Competitor Threat Radar)
   */
  analyzeCompetitorThreats(competitorActivities = []) {
    const threats = [];
    const evidenceTemplates = this.rules.threatEvidenceTemplates || {};

    competitorActivities.forEach(item => {
      // 1. Price war detection (Price Undercutting > 15%)
      if (item.discountPct >= 0.15 || (item.priceRatio && item.priceRatio <= 0.85)) {
        const discountPctStr = (item.discountPct * 100).toFixed(0);
        const evidenceStr = (evidenceTemplates.priceWar || '').replace('{discountPct}', discountPctStr);

        threats.push({
          type: ThreatType.PRICE_WAR_THREAT,
          severity: ThreatSeverity.HIGH,
          competitor: item.competitorName,
          targetProduct: item.productName,
          evidence: evidenceStr,
          urgency: UrgencyLevel.ACTION_WITHIN_24H,
        });
      }

      // 2. New product / viral campaign detection (Copycat / New Launch)
      if (item.isNewLaunch || item.buzzScore >= 80) {
        const buzzScoreStr = item.buzzScore || 85;
        const evidenceStr = (evidenceTemplates.newLaunch || '').replace('{buzzScore}', buzzScoreStr);

        threats.push({
          type: ThreatType.NEW_PRODUCT_LAUNCH_THREAT,
          severity: ThreatSeverity.MEDIUM,
          competitor: item.competitorName,
          targetProduct: item.productName,
          evidence: evidenceStr,
          urgency: UrgencyLevel.ACTION_WITHIN_7D,
        });
      }
    });

    return {
      totalThreats: threats.length,
      threatLevel: threats.some(t => t.severity === ThreatSeverity.HIGH) ? ThreatSeverity.HIGH_ALERT : (threats.length > 0 ? ThreatSeverity.ELEVATED : ThreatSeverity.LOW),
      threats,
      analyzedAt: this.clock().toISOString(),
    };
  }

  /**
   * Generates autonomous counter actions and R&D hand-offs (Autonomous Action Generator & R&D Hand-off)
   */
  generateAutonomousActions(threatRadar) {
    const actions = [];
    const rndMissions = [];
    const taskTemplate = this.rules.rndTaskTemplate || '';
    const deliverables = this.rules.rndDeliverables || [];

    threatRadar.threats.forEach(t => {
      if (t.type === ThreatType.PRICE_WAR_THREAT) {
        actions.push({
          actionId: `act_pricing_${crypto.randomUUID().substring(0, 6)}`,
          type: 'DYNAMIC_PRICING_RESPONSE',
          target: t.targetProduct,
          recommendation: this.rules.pricingResponseRecommendation || '',
          expectedMarginImpact: '-2% (safe)',
        });
      } else if (t.type === ThreatType.NEW_PRODUCT_LAUNCH_THREAT) {
        const taskStr = taskTemplate
          .replace('{targetProduct}', t.targetProduct)
          .replace('{competitor}', t.competitor);

        rndMissions.push({
          missionId: `mission_rnd_${crypto.randomUUID().substring(0, 6)}`,
          targetAgent: DomainAgent.RND,
          priority: 'P0_CRITICAL',
          task: taskStr,
          slaHours: 24,
          deliverables,
        });
      }
    });

    return {
      threatLevel: threatRadar.threatLevel,
      recommendedResponses: actions,
      rndMissionsHandOff: rndMissions,
      generatedAt: this.clock().toISOString(),
    };
  }
}

module.exports = MarketIntelligenceSynthesizerService;
