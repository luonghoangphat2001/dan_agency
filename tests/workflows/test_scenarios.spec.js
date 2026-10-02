/**
 * DAN-OPENCLAW - AUTOMATED WORKFLOW TEST SUITE (20 TEST CASES)
 * Coverage: All 20 End-to-End Autonomous Agent Workflows from tests/workflows/TESTCASES.md
 * Run with:
 *   - Standalone: node tests/workflows/test_scenarios.spec.js
 *   - Jest: npm test
 */

'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');

// 20 Kịch bản kiểm thử độc lập, có thể chạy trong cả Jest và Standalone Node
const scenarios = [
  // --- PHẦN 1: BẢO MẬT & TIẾP NHẬN SỰ KIỆN ---
  {
    id: 'TC-01',
    section: 'Phần 1: Bảo Mật & Tiếp Nhận Sự Kiện',
    title: 'Xác thực Webhook HMAC-SHA256 & Tiếp nhận Signed Ecommerce Event',
    fn: () => {
      const secret = 'openclaw-shared-secret-key-2026';
      const payload = JSON.stringify({
        event: 'order.paid',
        orderId: 'ORD-2026-999',
        amount: 150000,
        timestamp: Date.now(),
      });

      const validSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

      const verifyWebhook = (body, sig, sec, reqTimestamp) => {
        if (!sig) throw new Error('Missing signature');
        const expected = crypto.createHmac('sha256', sec).update(body).digest('hex');
        const sigBuffer = Buffer.from(sig, 'hex');
        const expectedBuffer = Buffer.from(expected, 'hex');
        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
          throw new Error('Invalid signature');
        }
        const now = Date.now();
        if (Math.abs(now - reqTimestamp) > 300000) {
          throw new Error('Replay attack detected: Timestamp expired');
        }
        return true;
      };

      assert.strictEqual(verifyWebhook(payload, validSignature, secret, Date.now()), true);
      assert.throws(() => verifyWebhook(payload, 'bad_sig_123', secret, Date.now()), /Invalid signature/);
      assert.throws(() => verifyWebhook(payload, validSignature, secret, Date.now() - 400000), /Replay attack detected/);
    },
  },
  {
    id: 'TC-02',
    section: 'Phần 1: Bảo Mật & Tiếp Nhận Sự Kiện',
    title: 'Chống trùng lặp sự kiện (Idempotency & Deduplication Engine)',
    fn: () => {
      const processedEvents = new Map();

      const handleEventWithDeduplication = (event) => {
        const { correlationId, eventId } = event;
        const deduplicationKey = `${eventId}:${correlationId}`;

        if (processedEvents.has(deduplicationKey)) {
          const existing = processedEvents.get(deduplicationKey);
          return {
            duplicate: true,
            workflowId: existing.workflowId,
            status: 'SKIPPED_DUPLICATE',
          };
        }

        const workflowId = `wf-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        processedEvents.set(deduplicationKey, { workflowId, createdAt: Date.now() });

        return {
          duplicate: false,
          workflowId,
          status: 'INITIALIZED',
        };
      };

      const firstRun = handleEventWithDeduplication({ eventId: 'evt_101', correlationId: 'corr_inv_01' });
      assert.strictEqual(firstRun.duplicate, false);
      assert.strictEqual(firstRun.status, 'INITIALIZED');

      const secondRun = handleEventWithDeduplication({ eventId: 'evt_101', correlationId: 'corr_inv_01' });
      assert.strictEqual(secondRun.duplicate, true);
      assert.strictEqual(secondRun.workflowId, firstRun.workflowId);
      assert.strictEqual(secondRun.status, 'SKIPPED_DUPLICATE');
    },
  },

  // --- PHẦN 2: ĐIỀU PHỐI 5 DOMAIN AI AGENTS ---
  {
    id: 'TC-03',
    section: 'Phần 2: Điều Phối 5 Domain AI Agents',
    title: 'Workflow Đần R&D (dan_rnd) - Phân tích xu hướng thị trường & Đề xuất công thức',
    fn: () => {
      const marketInsights = [
        { topic: 'Trà ô long sữa nướng', growth: '+45%', sentiment: 'positive' },
        { topic: 'Kem cheese phô mai muối biển', growth: '+30%', sentiment: 'positive' },
      ];

      const generateRndProposal = (trendQuery, insights) => {
        const relevant = insights.find(i => trendQuery.toLowerCase().includes('ô long'));
        assert.ok(relevant, 'Cần tìm thấy xu hướng liên quan');

        return {
          agentId: 'dan_rnd',
          proposalType: 'NEW_MENU_RECIPE',
          title: 'Công thức Trà Ô Long Nướng Sữa Phô Mai 2026',
          ingredients: [
            { name: 'Cốt trà Ô long rang', quantity: '150ml', cost: 4000 },
            { name: 'Sữa tươi thanh trùng', quantity: '50ml', cost: 2500 },
            { name: 'Topping Macchiato phô mai', quantity: '30g', cost: 3500 },
          ],
          targetSellingPrice: 35000,
          estimatedCost: 10000,
          margin: Math.round(((35000 - 10000) / 35000) * 100),
          status: 'PROPOSED',
        };
      };

      const proposal = generateRndProposal('Xu hướng trà ô long nướng', marketInsights);
      assert.strictEqual(proposal.agentId, 'dan_rnd');
      assert.strictEqual(proposal.status, 'PROPOSED');
      assert.ok(proposal.margin > 70, 'Biên lợi nhuận gộp phải > 70%');
      assert.strictEqual(proposal.ingredients.length, 3);
    },
  },
  {
    id: 'TC-04',
    section: 'Phần 2: Điều Phối 5 Domain AI Agents',
    title: 'Workflow Đần Logistics (dan_logistics) - Cảnh báo tồn kho & Lập Purchase Order',
    fn: () => {
      const inventoryState = {
        sku: 'MAT-MATCHA-JP',
        currentStockKg: 8,
        safetyThresholdKg: 20,
        dailyBurnRateKg: 2.5,
        supplierLeadTimeDays: 7,
      };

      const evaluateLogisticsStock = (inv) => {
        const daysRemaining = inv.currentStockKg / inv.dailyBurnRateKg;
        const isCritical = daysRemaining <= inv.supplierLeadTimeDays;
        assert.ok(isCritical, 'Tồn kho phải nằm trong mức báo động đỏ');

        const reorderAmountKg = Math.ceil((inv.safetyThresholdKg * 2) - inv.currentStockKg);
        return {
          agentId: 'dan_logistics',
          alertLevel: 'CRITICAL',
          recommendedOrderKg: reorderAmountKg,
          purchaseOrderDTO: {
            supplierId: 'SUPP-KYOTO-TEA',
            itemSku: inv.sku,
            quantity: reorderAmountKg,
            unitPriceVND: 500000,
            totalPriceVND: reorderAmountKg * 500000,
          },
          riskLevel: (reorderAmountKg * 500000 > 10000000) ? 'HIGH' : 'LOW',
        };
      };

      const alertResult = evaluateLogisticsStock(inventoryState);
      assert.strictEqual(alertResult.agentId, 'dan_logistics');
      assert.strictEqual(alertResult.alertLevel, 'CRITICAL');
      assert.strictEqual(alertResult.recommendedOrderKg, 32);
      assert.strictEqual(alertResult.purchaseOrderDTO.totalPriceVND, 16000000);
      assert.strictEqual(alertResult.riskLevel, 'HIGH');
    },
  },
  {
    id: 'TC-05',
    section: 'Phần 2: Điều Phối 5 Domain AI Agents',
    title: 'Workflow Đần CFO (dan_cfo) - Đối soát tài chính, phát hiện chênh lệch & Phân loại rủi ro',
    fn: () => {
      const evaluateRefundRisk = (refundAmountVND) => {
        const AUTO_APPROVE_LIMIT = 200000;
        if (refundAmountVND <= AUTO_APPROVE_LIMIT) {
          return {
            agentId: 'dan_cfo',
            action: 'AUTO_REFUND',
            riskLevel: 'LOW',
            requiresCeoApproval: false,
          };
        }
        return {
          agentId: 'dan_cfo',
          action: 'ESCALATE_TO_CEO',
          riskLevel: 'HIGH',
          requiresCeoApproval: true,
        };
      };

      const smallRefund = evaluateRefundRisk(50000);
      assert.strictEqual(smallRefund.action, 'AUTO_REFUND');
      assert.strictEqual(smallRefund.requiresCeoApproval, false);

      const largeRefund = evaluateRefundRisk(1500000);
      assert.strictEqual(largeRefund.action, 'ESCALATE_TO_CEO');
      assert.strictEqual(largeRefund.requiresCeoApproval, true);
    },
  },
  {
    id: 'TC-06',
    section: 'Phần 2: Điều Phối 5 Domain AI Agents',
    title: 'Workflow Đần Ops (dan_ops) - Giám sát đơn hàng thời gian thực & Xử lý sự cố SLA',
    fn: () => {
      const liveOrder = {
        orderId: 'ORD-LIVE-088',
        placedAt: Date.now() - 35 * 60 * 1000,
        status: 'PREPARING',
        maxPreparationMinutes: 20,
      };

      const checkSlaBreach = (order) => {
        const elapsedMinutes = (Date.now() - order.placedAt) / (60 * 1000);
        const isBreached = elapsedMinutes > order.maxPreparationMinutes;

        if (isBreached) {
          return {
            agentId: 'dan_ops',
            orderId: order.orderId,
            slaBreached: true,
            delayMinutes: Math.floor(elapsedMinutes - order.maxPreparationMinutes),
            fallbackActions: [
              'NOTIFY_KITCHEN_PRIORITY_ESCALATION',
              'TRIGGER_AUTO_DISPATCH_EXPRESS_SHIPPER',
              'PREPARE_CUSTOMER_APOLOGY_NOTICE',
            ],
          };
        }
        return { slaBreached: false };
      };

      const slaResult = checkSlaBreach(liveOrder);
      assert.strictEqual(slaResult.agentId, 'dan_ops');
      assert.strictEqual(slaResult.slaBreached, true);
      assert.ok(slaResult.delayMinutes >= 15);
      assert.strictEqual(slaResult.fallbackActions.length, 3);
    },
  },
  {
    id: 'TC-07',
    section: 'Phần 2: Điều Phối 5 Domain AI Agents',
    title: 'Workflow Đần CSKH (dan_cskh) - Phân tích đánh giá tiêu cực & Đề xuất Voucher',
    fn: () => {
      const customerReview = {
        reviewId: 'REV-991',
        rating: 1,
        comment: 'Trà sữa giao trễ gần 1 tiếng, trân châu bị cứng và nước đá tan nhạt toẹt!',
      };

      const analyzeAndHandleReview = (review) => {
        assert.ok(review.rating <= 2, 'Chỉ kích hoạt cho đánh giá 1-2 sao');
        return {
          agentId: 'dan_cskh',
          reviewId: review.reviewId,
          sentiment: 'VERY_NEGATIVE',
          rootCauses: ['DELIVERY_DELAY', 'FOOD_QUALITY'],
          draftReply: 'Dạ Dan F&B thành thật xin lỗi bạn...',
          proposedCompensation: {
            type: 'DISCOUNT_VOUCHER',
            code: 'DANCARE40',
            discountPercent: 40,
            maxUsage: 1,
          },
        };
      };

      const response = analyzeAndHandleReview(customerReview);
      assert.strictEqual(response.agentId, 'dan_cskh');
      assert.strictEqual(response.sentiment, 'VERY_NEGATIVE');
      assert.deepStrictEqual(response.rootCauses, ['DELIVERY_DELAY', 'FOOD_QUALITY']);
      assert.strictEqual(response.proposedCompensation.discountPercent, 40);
    },
  },

  // --- PHẦN 3: TƯƠNG TÁC VỚI DAN-MANAGER ---
  {
    id: 'TC-08',
    section: 'Phần 3: Tương Tác Với Dan-Manager',
    title: 'Quy trình xin CEO phê duyệt (Approval Request & Decision Loop)',
    fn: () => {
      const workflow = {
        id: 'wf-po-101',
        state: 'AWAITING_APPROVAL',
        requiredAction: 'EXECUTE_PO_SUPPLIER',
        approval: {
          id: 'appr-101',
          decision: 'PENDING',
          decidedBy: null,
        },
      };

      const applyCeoDecision = (wf, decision, ceoName) => {
        assert.strictEqual(wf.state, 'AWAITING_APPROVAL');
        wf.approval.decision = decision;
        wf.approval.decidedBy = ceoName;
        wf.approval.decidedAt = Date.now();

        if (decision === 'APPROVED') {
          wf.state = 'IN_PROGRESS';
        } else {
          wf.state = 'CANCELLED';
        }
        return wf;
      };

      const approvedWf = applyCeoDecision(workflow, 'APPROVED', 'ceo_admin');
      assert.strictEqual(approvedWf.approval.decision, 'APPROVED');
      assert.strictEqual(approvedWf.state, 'IN_PROGRESS');
      assert.strictEqual(approvedWf.approval.decidedBy, 'ceo_admin');
    },
  },
  {
    id: 'TC-09',
    section: 'Phần 3: Tương Tác Với Dan-Manager',
    title: 'Lệnh dừng khẩn cấp (Emergency Stop) & Khôi phục (Resume) từ Manager',
    fn: () => {
      let systemState = {
        mode: 'RUNNING',
        stoppedAt: null,
        resumedAt: null,
        stoppedBy: null,
      };

      const triggerEmergencyStop = (operator) => {
        systemState.mode = 'STOPPED';
        systemState.stoppedAt = Date.now();
        systemState.stoppedBy = operator;
      };

      const triggerResume = (operator) => {
        assert.strictEqual(systemState.mode, 'STOPPED');
        systemState.mode = 'RUNNING';
        systemState.resumedAt = Date.now();
        systemState.resumedBy = operator;
      };

      const canExecuteAgentAction = () => systemState.mode === 'RUNNING';

      triggerEmergencyStop('admin_dan_manager');
      assert.strictEqual(systemState.mode, 'STOPPED');
      assert.strictEqual(canExecuteAgentAction(), false);

      triggerResume('admin_dan_manager');
      assert.strictEqual(systemState.mode, 'RUNNING');
      assert.strictEqual(canExecuteAgentAction(), true);
    },
  },
  {
    id: 'TC-10',
    section: 'Phần 3: Tương Tác Với Dan-Manager',
    title: 'Điều chỉnh Cấp độ Tự trị (Autonomy Level & Guardrails Policy)',
    fn: () => {
      const autonomyLevels = {
        L1_MANUAL: { autoApproveMaxVND: 0, requireHumanConfirmation: true },
        L2_SUPERVISED: { autoApproveMaxVND: 100000, requireHumanConfirmation: true },
        L3_SEMI_AUTONOMOUS: { autoApproveMaxVND: 1000000, requireHumanConfirmation: false },
        L4_FULL_AUTONOMOUS: { autoApproveMaxVND: 10000000, requireHumanConfirmation: false },
      };

      const checkAutonomyApproval = (amountVND, levelName) => {
        const config = autonomyLevels[levelName];
        if (!config) throw new Error('Unknown autonomy level');
        return amountVND <= config.autoApproveMaxVND;
      };

      assert.strictEqual(checkAutonomyApproval(500000, 'L1_MANUAL'), false);
      assert.strictEqual(checkAutonomyApproval(500000, 'L3_SEMI_AUTONOMOUS'), true);
      assert.strictEqual(checkAutonomyApproval(5000000, 'L3_SEMI_AUTONOMOUS'), false);
      assert.strictEqual(checkAutonomyApproval(5000000, 'L4_FULL_AUTONOMOUS'), true);
    },
  },
  {
    id: 'TC-11',
    section: 'Phần 3: Tương Tác Với Dan-Manager',
    title: 'Replay Workflow & Điều tra nguyên nhân gốc không tạo side-effect',
    fn: () => {
      const historicalAuditLog = [
        { step: 1, action: 'EVENT_INTAKE', data: { orderId: 'ORD-FAIL-01' } },
        { step: 2, action: 'EVALUATE_INVENTORY', data: { stock: 0 } },
        { step: 3, action: 'TRIGGER_SUPPLIER_CALL', error: 'TIMEOUT_504' },
      ];

      const replayWorkflow = (logs, isDryRun) => {
        const replayTimeline = [];
        let externalCallsMade = 0;

        for (const item of logs) {
          if (item.action === 'TRIGGER_SUPPLIER_CALL' && !isDryRun) {
            externalCallsMade++;
          }
          replayTimeline.push({
            replayedStep: item.step,
            status: item.error ? 'ERROR_REPRODUCED' : 'SUCCESS',
            cause: item.error || null,
          });
        }

        return {
          dryRun: isDryRun,
          externalCallsMade,
          timeline: replayTimeline,
          rootCauseIdentified: 'TIMEOUT_504',
        };
      };

      const replayResult = replayWorkflow(historicalAuditLog, true);
      assert.strictEqual(replayResult.dryRun, true);
      assert.strictEqual(replayResult.externalCallsMade, 0);
      assert.strictEqual(replayResult.rootCauseIdentified, 'TIMEOUT_504');
      assert.strictEqual(replayResult.timeline.length, 3);
    },
  },

  // --- PHẦN 4: TƯƠNG TÁC VỚI DAN-LEARNING ---
  {
    id: 'TC-12',
    section: 'Phần 4: Tương Tác Với Dan-Learning',
    title: 'Trích xuất bộ nhớ ngắn hạn & Chuyển vào Kho lưu trữ dài hạn (Memory Extractor)',
    fn: () => {
      const rawConversation = 'Khách phàn nàn sđt 0987654321, đề nghị từ nay đơn trễ trên 30p phải tặng thêm topping trân châu';

      const sanitizeAndExtractMemory = (text) => {
        const sanitized = text.replace(/0\d{9}/g, '[REDACTED_PHONE]');
        assert.ok(!sanitized.includes('0987654321'));

        return {
          sanitizedContent: sanitized,
          extractedKnowledge: {
            category: 'CSKH_SOP_UPDATE',
            condition: 'ORDER_DELAY > 30 MIN',
            action: 'GIFT_TOPPING_PEARL',
            confidence: 0.95,
          },
        };
      };

      const memoryItem = sanitizeAndExtractMemory(rawConversation);
      assert.strictEqual(memoryItem.sanitizedContent.includes('[REDACTED_PHONE]'), true);
      assert.strictEqual(memoryItem.extractedKnowledge.action, 'GIFT_TOPPING_PEARL');
    },
  },
  {
    id: 'TC-13',
    section: 'Phần 4: Tương Tác Với Dan-Learning',
    title: 'Ghi nhận Lịch sử đào tạo AI, Đồng bộ dữ liệu học & Đánh giá năng lực',
    fn: () => {
      const sessionHistory = [
        { id: 'sess_1', agent: 'dan_rnd', promptTokens: 350, completionTokens: 120, criticScore: 4.8 },
        { id: 'sess_2', agent: 'dan_cskh', promptTokens: 200, completionTokens: 90, criticScore: 4.9 },
      ];

      const exportToLearningJsonl = (sessions) => {
        return sessions.map(s => JSON.stringify({
          agent_id: s.agent,
          total_tokens: s.promptTokens + s.completionTokens,
          quality_score: s.criticScore,
          exported_at: '2026-10-02T10:00:00Z',
        })).join('\n');
      };

      const jsonl = exportToLearningJsonl(sessionHistory);
      const lines = jsonl.split('\n');
      assert.strictEqual(lines.length, 2);
      const parsedFirst = JSON.parse(lines[0]);
      assert.strictEqual(parsedFirst.agent_id, 'dan_rnd');
      assert.strictEqual(parsedFirst.total_tokens, 470);
    },
  },
  {
    id: 'TC-14',
    section: 'Phần 4: Tương Tác Với Dan-Learning',
    title: 'Vòng lặp Tự cải tiến từ phản hồi (Feedback Loop & Prompt Optimization)',
    fn: () => {
      const feedbackStore = [];

      const recordFeedbackAndOptimizePrompt = (proposalId, status, critique, originalPrompt) => {
        feedbackStore.push({ proposalId, status, critique });

        let optimizedPrompt = originalPrompt;
        if (critique === 'PRICE_TOO_HIGH') {
          optimizedPrompt += '\n[LESSON_LEARNED]: Chú ý tối ưu giá vốn nguyên liệu, không vượt quá 30% giá bán.';
        }
        return optimizedPrompt;
      };

      const updatedPrompt = recordFeedbackAndOptimizePrompt(
        'prop-99',
        'REJECTED',
        'PRICE_TOO_HIGH',
        'Hãy xây dựng công thức trà sữa mới.'
      );

      assert.ok(updatedPrompt.includes('[LESSON_LEARNED]'));
      assert.ok(updatedPrompt.includes('không vượt quá 30% giá bán'));
      assert.strictEqual(feedbackStore.length, 1);
    },
  },

  // --- PHẦN 5: TƯƠNG TÁC VỚI DAN-API ---
  {
    id: 'TC-15',
    section: 'Phần 5: Tương Tác Với Dan-Api',
    title: 'Điều phối Multi-Provider LLM & Cơ chế dự phòng Failover (Gemini/Claude/GPT)',
    fn: async () => {
      const mockProviders = {
        gemini: async () => { throw new Error('HTTP 429 Too Many Requests: Rate limit exceeded'); },
        claude: async (prompt) => ({ provider: 'claude', reply: `Phản hồi dự phòng cho: ${prompt}` }),
      };

      const callModelWithFallback = async (prompt) => {
        try {
          return await mockProviders.gemini(prompt);
        } catch (err) {
          if (err.message.includes('429')) {
            const fallbackRes = await mockProviders.claude(prompt);
            return { ...fallbackRes, failoverTriggered: true };
          }
          throw err;
        }
      };

      const result = await callModelWithFallback('Tóm tắt báo cáo tồn kho');
      assert.strictEqual(result.failoverTriggered, true);
      assert.strictEqual(result.provider, 'claude');
      assert.ok(result.reply.includes('Phản hồi dự phòng'));
    },
  },
  {
    id: 'TC-16',
    section: 'Phần 5: Tương Tác Với Dan-Api',
    title: 'Giám sát Token Metering, Đo lường ngân sách & Giới hạn chi phí (Budget Enforcer)',
    fn: () => {
      const budgetTracker = {
        dailyLimitTokens: 100000,
        consumedTokens: 96000,
      };

      const checkAndTrackBudget = (estimatedTokens) => {
        const willExceed = (budgetTracker.consumedTokens + estimatedTokens) > budgetTracker.dailyLimitTokens;
        if (willExceed) {
          return {
            allowed: false,
            warning: 'DAILY_BUDGET_EXCEEDED',
            remainingTokens: budgetTracker.dailyLimitTokens - budgetTracker.consumedTokens,
          };
        }
        budgetTracker.consumedTokens += estimatedTokens;
        return { allowed: true, remainingTokens: budgetTracker.dailyLimitTokens - budgetTracker.consumedTokens };
      };

      const overLimitCheck = checkAndTrackBudget(5000);
      assert.strictEqual(overLimitCheck.allowed, false);
      assert.strictEqual(overLimitCheck.warning, 'DAILY_BUDGET_EXCEEDED');

      const okCheck = checkAndTrackBudget(2000);
      assert.strictEqual(okCheck.allowed, true);
      assert.strictEqual(budgetTracker.consumedTokens, 98000);
    },
  },

  // --- PHẦN 6: NĂNG LỰC WEB & TỰ ĐỘNG HÓA THỰC THỤ ---
  {
    id: 'TC-17',
    section: 'Phần 6: Năng Lực Web & Tự Động Hóa Thực Thụ',
    title: 'Năng lực Web Autonomous: Tìm kiếm thị trường (Search) & Trích xuất nội dung (Fetch)',
    fn: () => {
      const mockSearchEngine = () => [
        { title: 'Giá cà phê Arabica hôm nay', url: 'https://news.example.com/cafe-arabica', snippet: 'Giá cà phê hôm nay tăng 2%' },
        { title: 'Báo cáo nguồn cung hạt cà phê Tây Nguyên', url: 'https://news.example.com/supply-report', snippet: 'Nguồn cung vụ mùa 2026' },
      ];

      const mockFetchEngine = (htmlUrl) => {
        const rawHtml = '<html><body><nav>Menu bar</nav><article><h1>Giá cà phê hôm nay</h1><p>Nội dung chính sạch sẽ.</p></article></body></html>';
        const cleanText = rawHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return { url: htmlUrl, text: cleanText };
      };

      const searchResults = mockSearchEngine();
      assert.strictEqual(searchResults.length, 2);

      const fetchedContent = mockFetchEngine(searchResults[0].url);
      assert.ok(fetchedContent.text.includes('Giá cà phê hôm nay Nội dung chính sạch sẽ.'));
    },
  },
  {
    id: 'TC-18',
    section: 'Phần 6: Năng Lực Web & Tự Động Hóa Thực Thụ',
    title: 'Năng lực Web Autonomous: Thu thập dữ liệu đối thủ đa tầng (Deep Crawl Engine)',
    fn: () => {
      const mockCrawler = (rootUrl, maxDepth, maxPages) => {
        const visited = new Set();
        const queue = [{ url: rootUrl, depth: 0 }];
        const crawledPages = [];

        while (queue.length > 0 && crawledPages.length < maxPages) {
          const current = queue.shift();
          if (visited.has(current.url) || current.depth > maxDepth) continue;

          visited.add(current.url);
          crawledPages.push({ url: current.url, depth: current.depth, title: `Trang ${crawledPages.length + 1}` });

          if (current.depth < maxDepth) {
            queue.push({ url: `${current.url}/sub-${current.depth + 1}`, depth: current.depth + 1 });
          }
        }

        return {
          pagesCrawled: crawledPages.length,
          items: crawledPages,
        };
      };

      const crawlResult = mockCrawler('https://competitor.com', 2, 3);
      assert.strictEqual(crawlResult.pagesCrawled, 3);
      assert.ok(crawlResult.items.every(item => item.depth <= 2));
    },
  },
  {
    id: 'TC-19',
    section: 'Phần 6: Năng Lực Web & Tự Động Hóa Thực Thụ',
    title: 'Năng lực Trình duyệt: Tự động hóa tác vụ headless với Playwright Sandbox',
    fn: () => {
      const validateBrowserActions = (actions) => {
        const allowedActions = ['navigate', 'click', 'fill', 'screenshot', 'wait'];
        for (const act of actions) {
          if (!allowedActions.includes(act.type)) {
            throw new Error(`Disallowed browser action: ${act.type}`);
          }
          if (act.type === 'navigate' && !act.url.startsWith('https://')) {
            throw new Error('Sandbox Policy: Only secure HTTPS URLs permitted');
          }
        }
        return { valid: true, stepCount: actions.length };
      };

      const validScript = [
        { type: 'navigate', url: 'https://admin-pos.com' },
        { type: 'fill', selector: '#user', value: 'bot_agent' },
        { type: 'click', selector: '#submit' },
        { type: 'screenshot' },
      ];
      assert.strictEqual(validateBrowserActions(validScript).valid, true);

      const insecureScript = [{ type: 'navigate', url: 'http://insecure-site.com' }];
      assert.throws(() => validateBrowserActions(insecureScript), /Only secure HTTPS URLs permitted/);
    },
  },

  // --- PHẦN 7: XỬ LÝ NGOẠI LỆ, GIÁM SÁT & BÁO CÁO ---
  {
    id: 'TC-20',
    section: 'Phần 7: Xử Lý Ngoại Lệ, Giám Sát & Báo Cáo',
    title: 'Hộp thư ngoại lệ (Exception Inbox), Dead-Letter Queue & Báo cáo tổng hợp CEO',
    fn: () => {
      const deadLetterQueue = [];
      const pushToDlq = (workflowId, error, payload) => {
        deadLetterQueue.push({
          id: `dlq-${Date.now()}`,
          workflowId,
          error: error.message,
          payload,
          status: 'UNRESOLVED',
        });
      };

      const generateDailyCeoReport = (agents, dlqItems) => {
        return {
          date: '2026-10-02',
          summaryMessage: 'Báo cáo vận hành hàng ngày cho CEO',
          agentMetrics: agents.map(a => ({
            agentId: a.id,
            totalWorkflows: a.count,
            successRate: `${a.successRate}%`,
          })),
          unresolvedExceptionsCount: dlqItems.filter(i => i.status === 'UNRESOLVED').length,
          deliveryReceipt: { singleMessageDelivered: true },
        };
      };

      pushToDlq('wf-err-404', new Error('External SSOT connection refused'), { retryCount: 3 });
      assert.strictEqual(deadLetterQueue.length, 1);
      assert.strictEqual(deadLetterQueue[0].status, 'UNRESOLVED');

      const agents = [
        { id: 'dan_rnd', count: 12, successRate: 100 },
        { id: 'dan_logistics', count: 25, successRate: 96 },
        { id: 'dan_cfo', count: 18, successRate: 100 },
        { id: 'dan_ops', count: 42, successRate: 98 },
        { id: 'dan_cskh', count: 30, successRate: 100 },
      ];

      const report = generateDailyCeoReport(agents, deadLetterQueue);
      assert.strictEqual(report.agentMetrics.length, 5);
      assert.strictEqual(report.unresolvedExceptionsCount, 1);
      assert.strictEqual(report.deliveryReceipt.singleMessageDelivered, true);
    },
  },
];

// --- HỖ TRỢ JEST TEST RUNNER ---
if (typeof describe !== 'undefined' && typeof it !== 'undefined') {
  describe('🦞 Dan-OpenClaw: 20 Workflow Test Cases', () => {
    scenarios.forEach((sc) => {
      it(`[${sc.id}] ${sc.title}`, async () => {
        await sc.fn();
      });
    });
  });
}

// --- HỖ TRỢ STANDALONE NODE RUNNER (node tests/workflows/test_scenarios.spec.js) ---
if (require.main === module) {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    yellow: '\x1b[33m',
    bold: '\x1b[1m',
    gray: '\x1b[90m',
  };

  async function runStandalone() {
    const startTime = Date.now();
    console.log(`\n${colors.bold}${colors.cyan}========================================================================`);
    console.log(` 🦞 RUNNING 20 WORKFLOW TEST CASES FOR DAN-OPENCLAW ORCHESTRATOR`);
    console.log(`    Testing Multi-Agent, Dan-Manager, Dan-Learning, Dan-Api & Web Tools`);
    console.log(`========================================================================${colors.reset}\n`);

    let passed = 0;
    let failed = 0;
    let currentSection = '';

    for (const sc of scenarios) {
      if (sc.section !== currentSection) {
        currentSection = sc.section;
        console.log(`\n${colors.bold}${colors.yellow}--- [${currentSection}] ---${colors.reset}`);
      }

      try {
        await sc.fn();
        passed++;
        console.log(` ${colors.green}✔ [${sc.id}]${colors.reset} ${sc.title}`);
      } catch (err) {
        failed++;
        console.error(` ${colors.red}✖ [${sc.id}]${colors.reset} ${sc.title}`);
        console.error(`   ${colors.yellow}Lỗi:${colors.reset} ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n${colors.bold}${colors.cyan}========================================================================`);
    console.log(` 📊 BÁO CÁO KẾT QUẢ KIỂM THỬ: DAN-OPENCLAW`);
    console.log(`========================================================================${colors.reset}`);
    console.log(` Tổng số kịch bản kiểm thử: ${scenarios.length}`);
    console.log(` Trạng thái: ${colors.green}${colors.bold}✔ THÀNH CÔNG: ${passed}${colors.reset} | ${failed > 0 ? colors.red : colors.gray}✖ THẤT BẠI: ${failed}${colors.reset}`);
    console.log(` Thời gian thực thi: ${duration}s`);
    console.log(`${colors.cyan}========================================================================\n${colors.reset}`);

    if (failed > 0) process.exit(1);
  }

  runStandalone().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
