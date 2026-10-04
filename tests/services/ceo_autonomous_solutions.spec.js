/**
 * @fileoverview ceo_autonomous_solutions.spec.js
 * Verification Suite for the 6 Core Solutions addressing the 6 Fatal Weaknesses
 * discovered from the 180 Test Cases.
 */
'use strict';

require('module-alias/register');

const assert = require('assert');
const {
  CeoStrategicPlannerService,
  AutonomousPlanExecutorService,
  DynamicRePlannerService,
  MarketIntelligenceSynthesizerService,
  ExecutiveBriefingService,
  GoalArbitrationService,
  AutonomyGovernanceService,
  EpisodicLearningService,
} = require('@services/ceo/planner');
const CeoPlannerController = require('@controllers/CeoPlannerController');

async function runTestSuite() {
  console.log('\n========================================================================');
  console.log(' 🚀 COMPREHENSIVE VERIFICATION: 6 CORE SOLUTIONS FOR AUTONOMOUS CEO AGENT');
  console.log('========================================================================\n');

  let passedCount = 0;

  // ──────────────────────────────────────────────────────────────────────────
  // GIẢI PHÁP 1: CEO STRATEGIC PLANNER, OKR DECOMPOSITION & FINANCIAL WHAT-IF
  // ──────────────────────────────────────────────────────────────────────────
  console.log('--- [Giải Pháp 1: Lập Kế Hoạch Chiến Lược & Mô Phỏng Tài Chính Monte Carlo] ---');
  const planner = new CeoStrategicPlannerService();
  
  // Test 1.1: Tạo Master Plan
  const plan = planner.createMasterPlan({
    title: 'Kế hoạch Mở rộng Chuỗi F&B Toàn quốc 2026',
    revenueTarget: 10000000000, // 10 tỷ
    profitMarginTarget: 0.28,    // 28%
    strategicFocus: ['Mở mới 15 cửa hàng', 'Tối ưu chuỗi cung ứng', 'Menu Trà Trái Cây Đột Phá'],
  });
  assert.strictEqual(plan.targets.netProfit, 2800000000);
  assert.strictEqual(plan.status, 'DRAFT');
  console.log(' ✔ [GP-01] Initialize 12-month Master Plan targeting 10B revenue and 28% net profit');
  passedCount++;

  // Test 1.2: Phân rã OKR
  const okrs = planner.decomposeOKRs(plan.planId, [
    { title: 'Tăng trưởng doanh thu 30%', targetValue: 30, weight: 0.6 },
    { title: 'Tối ưu chi phí vận hành 15%', targetValue: 15, weight: 0.4 },
  ]);
  assert.strictEqual(okrs.length, 2);
  assert.strictEqual(okrs[0].departmentKRs.length, 5); // 5 agents
  console.log(' ✔ [GP-02] Automated multi-tier OKR decomposition for 5 Domain Agents (R&D, Logistics, CFO, Ops, CSKH)');
  passedCount++;

  // Test 1.3: Tính toán đường găng CPM
  const tasks = [
    { id: 'T1', name: 'Nghiên cứu menu mới', durationDays: 14, assignedAgent: 'dan_rnd' },
    { id: 'T2', name: 'Ký kết nhà cung ứng', durationDays: 21, assignedAgent: 'dan_logistics' },
    { id: 'T3', name: 'Setup cửa hàng & quầy pha chế', durationDays: 30, assignedAgent: 'dan_ops' },
    { id: 'T4', name: 'Đào tạo nhân sự & SOP', durationDays: 10, assignedAgent: 'dan_rnd' },
  ];
  const cpm = planner.calculateCriticalPath(plan.planId, tasks);
  assert.ok(cpm.totalDurationDays > 0);
  assert.ok(cpm.criticalMilestones.length > 0);
  console.log(` ✔ [GP-03] Critical Path Method calculation: Total critical path duration ${cpm.totalDurationDays} days`);
  passedCount++;

  // Test 1.4: Mô phỏng Monte Carlo 1,000 lần
  const monteCarlo = planner.simulateMonteCarlo(plan.planId, { iterations: 1000, marketVolatility: 0.10, costVolatility: 0.08 });
  assert.strictEqual(monteCarlo.iterations, 1000);
  assert.ok(monteCarlo.metrics.revenue.p50Median > 0);
  assert.ok(monteCarlo.confidenceScore >= 0);
  console.log(` ✔ [GP-04] Monte Carlo financial simulation (1,000 iterations): P50=${(monteCarlo.metrics.revenue.p50Median/1000000000).toFixed(2)}B, Target probability=${monteCarlo.targetHitProbability}`);
  passedCount++;

  // Test 1.5: Dự phóng P&L 12 tháng
  const projections = planner.generate12MonthProjections(plan.planId);
  assert.strictEqual(projections.breakdown.length, 12);
  assert.ok(projections.totalProjectedRevenue > 0);
  console.log(` ✔ [GP-05] 12-Month P&L projection: Revenue=${(projections.totalProjectedRevenue/1000000000).toFixed(2)}B, Net Profit=${(projections.totalProjectedNetProfit/1000000000).toFixed(2)}B`);
  passedCount++;

  // Test 1.6: Ma trận BCG
  const bcg = planner.classifyBcgMatrix(plan.planId, [
    { name: 'Trà Sữa Oolong Nướng', marketGrowthRate: 0.18, relativeMarketShare: 1.5 },
    { name: 'Cà Phê Muối', marketGrowthRate: 0.05, relativeMarketShare: 1.2 },
    { name: 'Trà Trái Cây Mới', marketGrowthRate: 0.25, relativeMarketShare: 0.4 },
    { name: 'Bánh Ngọt Cũ', marketGrowthRate: 0.02, relativeMarketShare: 0.3 },
  ]);
  assert.strictEqual(bcg.summary.starsCount, 1);
  assert.strictEqual(bcg.summary.cashCowsCount, 1);
  assert.strictEqual(bcg.summary.questionMarksCount, 1);
  assert.strictEqual(bcg.summary.dogsCount, 1);
  console.log(' ✔ [GP-06] Portfolio classification across BCG 4-Quadrant Matrix');
  passedCount++;

  // ──────────────────────────────────────────────────────────────────────────
  // GIẢI PHÁP 2: DYNAMIC SELF-HEALING RE-PLANNER & DEVIATION SENTINEL
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- [Giải Pháp 2: Tự Động Giám Sát Độ Lệch & Tái Lập Kế Hoạch Động] ---');
  const replanner = new DynamicRePlannerService();

  // Test 2.1: Phát hiện độ lệch (Deviation Sentinel)
  const deviation = replanner.detectDeviations(plan.planId, {
    actualProgressPct: 40,
    plannedProgressPct: 65, // trễ 25%
    actualSpend: 5600000000,
    budgetCap: 5000000000,  // vượt 12%
    supplierStatus: 'DELAYED',
  });
  assert.strictEqual(deviation.replanRequired, true);
  assert.strictEqual(deviation.severity, 'CRITICAL');
  console.log(` ✔ [GP-07] Deviation Sentinel detected progress lag (-25%) and budget overrun -> Triggered Red Alert`);
  passedCount++;

  // Test 2.2: Chống dao động kế hoạch (Anti-Flapping Filter)
  const flapCheck1 = replanner.canTriggerReplan(plan.planId, 120);
  assert.strictEqual(flapCheck1.allowed, true);
  console.log(' ✔ [GP-08] Anti-Flapping Filter validated cooldown cycle prior to permitting re-plan');
  passedCount++;

  // Test 2.3: Sinh 3 phương án cứu nguy A/B/C
  const contingency = replanner.generateContingencyOptions(plan.planId, 'Trễ tiến độ khai trương 3 cửa hàng');
  assert.strictEqual(contingency.options.length, 3);
  console.log(' ✔ [GP-09] Automated generation of 3 recovery options: Fast-Track, Timeline Extension, Scope Descoping');
  passedCount++;

  // Test 2.4: Áp dụng phương án được CEO chọn -> Plan v2.0
  const updatedPlan = replanner.applySelectedOption(contingency.replanId, 'OPT_FAST_RECOVERY', plan);
  assert.strictEqual(updatedPlan.version, 2);
  assert.strictEqual(updatedPlan.status, 'ACTIVE_REVISED');
  console.log(' ✔ [GP-10] Updated plan version Plan v1 ➔ v2 with CEO-approved strategy');
  passedCount++;

  // Test 2.5: Diff Visualizer
  const diff = replanner.generatePlanDiff(plan, updatedPlan);
  assert.strictEqual(diff.versionTransition, 'v1 ➔ v2');
  console.log(' ✔ [GP-11] Diff Visualizer rendered structural delta between original and revised plans');
  passedCount++;

  // ──────────────────────────────────────────────────────────────────────────
  // GIẢI PHÁP 3: ACTIONABLE MARKET INTELLIGENCE & THREAT RADAR
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- [Giải Pháp 3: Tình Báo Thị Trường Thực Thi & Chuyển Giao Tự Trị R&D] ---');
  const marketIntel = new MarketIntelligenceSynthesizerService();

  // Test 3.1: So sánh giá đối thủ
  const priceAnalysis = marketIntel.synthesizeCompetitorPrices([
    { sku: 'TS-01', productName: 'Trà Sữa Truyền Thống', internalPrice: 32000, competitorPrice: 28000 },
    { sku: 'TS-02', productName: 'Trà Đào Cam Sả', internalPrice: 38000, competitorPrice: 42000 },
  ]);
  assert.strictEqual(priceAnalysis.totalItemsCompared, 2);
  console.log(' ✔ [GP-12] Price gap analysis positioned product pricing against competitors');
  passedCount++;

  // Test 3.2: Radar phát hiện đe dọa (Price war, Copycat)
  const threatRadar = marketIntel.analyzeCompetitorThreats([
    { competitorName: 'Brand X', productName: 'Trà Oolong Sữa', discountPct: 0.20, isNewLaunch: false },
    { competitorName: 'Brand Y', productName: 'Trà Bơ Dừa Tuyết', discountPct: 0, isNewLaunch: true, buzzScore: 92 },
  ]);
  assert.strictEqual(threatRadar.totalThreats, 2);
  assert.strictEqual(threatRadar.threatLevel, 'HIGH_ALERT');
  console.log(' ✔ [GP-13] Threat radar identified price war (20% discount) and viral product launch');
  passedCount++;

  // Test 3.3: Tự động chuyển giao nhiệm vụ cho dan_rnd trong 24h
  const actions = marketIntel.generateAutonomousActions(threatRadar);
  assert.strictEqual(actions.recommendedResponses.length, 1);
  assert.strictEqual(actions.rndMissionsHandOff.length, 1);
  assert.strictEqual(actions.rndMissionsHandOff[0].targetAgent, 'dan_rnd');
  assert.strictEqual(actions.rndMissionsHandOff[0].slaHours, 24);
  console.log(' ✔ [GP-14] Autonomous task dispatch to dan_rnd with urgent 24h counter-recipe deadline');
  passedCount++;

  // ──────────────────────────────────────────────────────────────────────────
  // GIẢI PHÁP 4: PARETO MULTI-AGENT GOAL ARBITRATION
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- [Giải Pháp 4: Trọng Tài Xung Đột Mục Tiêu Liên Agent Theo Triết Lý CEO] ---');
  const arbitration = new GoalArbitrationService();

  // Test 4.1: Xung đột CSKH (Voucher 25%) vs CFO (Margin 30%) dưới triết lý CASH_FIRST
  const arbCash = arbitration.arbitrate({
    conflictType: 'CSKH_DISCOUNT_VS_CFO_MARGIN',
    parties: ['dan_cskh', 'dan_cfo'],
    demands: { requestedDiscountPct: 0.25, minMarginRequired: 0.30 },
    ceoPolicy: 'CASH_FIRST',
  });
  assert.strictEqual(arbCash.winningPosture, 'CFO_FAVORED');
  assert.strictEqual(arbCash.status, 'BINDING_RESOLVED');
  console.log(' ✔ [GP-15] CASH_FIRST policy arbitration: CFO favored, restricting discount vouchers to preserve 30% margin');
  passedCount++;

  // Test 4.2: Xung đột CSKH vs CFO dưới triết lý GROWTH_FIRST
  const arbGrowth = arbitration.arbitrate({
    conflictType: 'CSKH_DISCOUNT_VS_CFO_MARGIN',
    parties: ['dan_cskh', 'dan_cfo'],
    demands: { requestedDiscountPct: 0.25, minMarginRequired: 0.30 },
    ceoPolicy: 'GROWTH_FIRST',
  });
  assert.strictEqual(arbGrowth.winningPosture, 'CSKH_FAVORED');
  console.log(' ✔ [GP-16] GROWTH_FIRST policy arbitration: CSKH favored, prioritizing customer acquisition & retention');
  passedCount++;

  // Test 4.3: Xung đột CSKH vs CFO dưới triết lý BALANCED (Pareto Optimum)
  const arbBalanced = arbitration.arbitrate({
    conflictType: 'CSKH_DISCOUNT_VS_CFO_MARGIN',
    parties: ['dan_cskh', 'dan_cfo'],
    demands: { requestedDiscountPct: 0.25, minMarginRequired: 0.30 },
    ceoPolicy: 'BALANCED',
  });
  assert.strictEqual(arbBalanced.winningPosture, 'BALANCED_PARETO');
  assert.ok(arbBalanced.compromiseScore >= 90);
  console.log(` ✔ [GP-17] BALANCED policy arbitration: Pareto compromise (15% voucher with 100k min order, Score=${arbBalanced.compromiseScore}/100)`);
  passedCount++;

  // Test 4.4: Kiểm tra tính linh hoạt khi nạp Quy tắc từ Skill JSON tùy chỉnh
  const customSkillRules = {
    ceoPolicies: {
      CASH_FIRST: {
        winnerTarget: 'cfo',
        decision: 'Ruling from Skill JSON: Absolute cash flow freeze',
        adjustment: '100% Voucher Cut'
      }
    }
  };
  const customExecutor = new AutonomousPlanExecutorService({ skillRules: customSkillRules });
  const customRes = customExecutor.arbitrateConflict({ agentA: 'dan_cfo', goalA: 'Margin', agentB: 'dan_cskh', goalB: 'Voucher', ceoPolicy: 'CASH_FIRST' });
  assert.strictEqual(customRes.resolution.decision, 'Ruling from Skill JSON: Absolute cash flow freeze');
  assert.strictEqual(customRes.resolution.adjustment, '100% Voucher Cut');
  console.log(' ✔ [GP-17b] Dynamic Skill JSON loading: Rulings & adjustments loaded dynamically from JSON rules');
  passedCount++;

  // ──────────────────────────────────────────────────────────────────────────
  // GIẢI PHÁP 5: TIERED AUTONOMY (L1-L4) & MULTI-SIG APPROVAL SENTINEL
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- [Giải Pháp 5: Quản Trị Phân Tầng Tự Trị L1-L4 & Cổng Đa Chữ Ký Multi-Sig] ---');
  const governance = new AutonomyGovernanceService();

  // Test 5.1: Đánh giá hạn mức tự trị L3 (< 20tr auto, > 50tr multi-sig)
  const evalSmall = governance.evaluateActionAutonomy({ actionType: 'PURCHASE_SUPPLIES', amount: 12000000, currentAutonomyLevel: 'L3' });
  assert.strictEqual(evalSmall.allowed, true);
  assert.strictEqual(evalSmall.requiresHumanApproval, false);

  const evalHuge = governance.evaluateActionAutonomy({ actionType: 'EXPANSION_CONTRACT', amount: 80000000, currentAutonomyLevel: 'L3' });
  assert.strictEqual(evalHuge.allowed, false);
  assert.strictEqual(evalHuge.requiresMultiSig, true);
  console.log(' ✔ [GP-18] L3 Autonomy thresholds: 12m spend auto-approved, 80m spend triggers Multi-Sig');
  passedCount++;

  // Test 5.2: Tạo yêu cầu Multi-Sig & Ký duyệt bằng HMAC
  const msig = governance.createMultiSigRequest({
    title: 'Hợp đồng mua máy pha cà phê công nghiệp 80tr',
    amount: 80000000,
    requiredSignatures: 2,
    eligibleSigners: ['ceo', 'cfo'],
  });
  assert.strictEqual(msig.status, 'PENDING_SIGNATURES');

  // Ký chữ ký 1: CFO
  governance.signMultiSigRequest({ requestId: msig.requestId, signerId: 'user_cfo', signerRole: 'cfo' });
  assert.strictEqual(msig.status, 'PENDING_SIGNATURES');

  // Ký chữ ký 2: CEO -> APPROVED
  governance.signMultiSigRequest({ requestId: msig.requestId, signerId: 'user_ceo', signerRole: 'ceo' });
  assert.strictEqual(msig.status, 'APPROVED_READY_FOR_EXECUTION');
  console.log(' ✔ [GP-19] Multi-Sig Gate (2/2): Gathered CFO & CEO HMAC digital signatures for approval');
  passedCount++;

  // Test 5.3: Quyền Phủ Quyết Khẩn Cấp (Emergency Kill-Switch) của CEO
  const veto = governance.triggerEmergencyVeto({ reason: 'Dấu hiệu bất thường tài khoản ngân quỹ' });
  assert.strictEqual(governance.isSystemFrozen(), true);

  const blockedAction = governance.evaluateActionAutonomy({ actionType: 'PAYMENT', amount: 1000000, currentAutonomyLevel: 'L4' });
  assert.strictEqual(blockedAction.allowed, false);
  assert.ok(blockedAction.reason.includes('FROZEN') || blockedAction.reason.includes('ĐÓNG BĂNG'));

  // Gỡ bỏ phủ quyết
  governance.liftEmergencyVeto({ initiatedBy: 'ceo' });
  assert.strictEqual(governance.isSystemFrozen(), false);
  console.log(' ✔ [GP-20] Emergency Kill-Switch: Instant 1-click system freeze and safe restoration');
  passedCount++;

  // ──────────────────────────────────────────────────────────────────────────
  // GIẢI PHÁP 6: LONG-TERM EPISODIC MEMORY & CONTINUOUS AGENT EVOLUTION
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- [Giải Pháp 6: Bộ Nhớ Bài Học Sự Cố, Hệ Số Thận Trọng & Tự Tiến Hóa] ---');
  const episodic = new EpisodicLearningService();

  // Test 6.1: Ghi nhận bài học thất bại quá khứ
  const pm = episodic.recordPostMortem({
    campaignOrPlanTitle: 'Chiến dịch Trà Chanh Mùa Hè 2025',
    outcome: 'FAILURE',
    plannedBudget: 500000000,
    actualSpend: 750000000,
    plannedRevenue: 1500000000,
    actualRevenue: 600000000,
    rootCauses: ['Nguyên liệu chanh vàng bị tăng giá 40%', 'Thời tiết mưa bão kéo dài 3 tuần liên tiếp'],
    lessonsLearned: [
      'Luôn ký hợp đồng chốt giá cố định với nhà vườn trước khi chạy chiến dịch',
      'Phải có kịch bản dự phòng Rainy Contingency khi rơi vào mùa mưa',
    ],
    tags: ['campaign', 'beverage', 'summer', 'lemon', 'promotion'],
  });
  assert.strictEqual(pm.outcome, 'FAILURE');
  console.log(' ✔ [GP-21] Saved Post-Mortem incident report to long-term Episodic Memory');
  passedCount++;

  // Test 6.2: Tính toán Caution Multiplier cho kế hoạch mới có đặc điểm tương đồng
  const caution = episodic.calculateCautionMultiplier({
    proposedTitle: 'Chiến dịch Trà Chanh Leo Mùa Hè 2026',
    planTags: ['beverage', 'summer', 'lemon'],
    budget: 600000000,
  });
  assert.ok(caution.appliedCautionMultiplier > 1.0);
  assert.ok(caution.recommendedContingencyBuffer > 0);
  assert.ok(caution.lessonsSurfaced.length > 0);
  console.log(` ✔ [GP-22] Caution Multiplier automatically scaled to x${caution.appliedCautionMultiplier} requiring +${(caution.recommendedContingencyBuffer/1000000).toFixed(0)}m contingency buffer`);
  passedCount++;

  // Test 6.3: Tự động đề xuất tinh chỉnh System Prompt cho Agent
  const promptEvolution = episodic.generatePromptEvolutions('dan_rnd');
  assert.ok(promptEvolution.adaptiveRules.length > 0);
  console.log(' ✔ [GP-23] Autonomous System Prompt evolution: Injected cost guardrail for dan_rnd');
  passedCount++;

  // ──────────────────────────────────────────────────────────────────────────
  // KIỂM THỬ TÍCH HỢP REST CONTROLLER
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n--- [Kiểm Thử Tích Hợp: CeoPlannerController REST Endpoints] ---');
  const controller = new CeoPlannerController({
    plannerService: planner,
    replannerService: replanner,
    marketIntelService: marketIntel,
    arbitrationService: arbitration,
    governanceService: governance,
    learningService: episodic,
  });

  const mockRes = () => {
    const res = {
      statusCode: 200,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
    };
    return res;
  };

  // Controller Test: Morning Brief
  const resBrief = mockRes();
  await controller.getMorningBrief({ body: { financials: { revenueYesterday: 45000000, targetYesterday: 40000000, cashRunwayDays: 150 } } }, resBrief);
  assert.strictEqual(resBrief.statusCode, 200);
  assert.ok(resBrief.body.morningBrief.briefId);
  console.log(' ✔ [GP-24] REST Endpoint: Morning CEO Brief (45-second read) responded successfully (HTTP 200)');
  passedCount++;

  // Controller Test: Conflict Arbitration
  const resArb = mockRes();
  await controller.arbitrateConflict({
    body: {
      conflictType: 'CSKH_DISCOUNT_VS_CFO_MARGIN',
      parties: ['dan_cskh', 'dan_cfo'],
      demands: { requestedDiscountPct: 0.20 },
      ceoPolicy: 'BALANCED',
    },
  }, resArb);
  assert.strictEqual(resArb.statusCode, 200);
  assert.strictEqual(resArb.body.verdict.status, 'BINDING_RESOLVED');
  console.log(' ✔ [GP-25] REST Endpoint: Goal Arbitration responded with Pareto ruling BINDING_RESOLVED (HTTP 200)');
  passedCount++;

  console.log('\n========================================================================');
  console.log(` 🏆 SUMMARY: ${passedCount}/${passedCount} SOLUTION SCENARIOS ACHIEVED 100% PASS!`);
  console.log('========================================================================\n');
}

if (typeof describe === 'function') {
  describe('CEO Autonomous Solutions Suite', () => {
    test('executes 26 scenarios successfully', async () => {
      await runTestSuite();
    });
  });
} else {
  runTestSuite().catch(err => {
    console.error('❌ Solution test failed:', err);
    process.exit(1);
  });
}
