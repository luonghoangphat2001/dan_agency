const dailyBriefService = require('@services/agent/DailyBriefService');
const aiEngineClient = require('@services/ai/AIEngineClient');

describe('Phase 4 & Phase 5: Dan ESR Multi-Agent & CEO Executive Cockpit', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('DailyBriefService generates 08:00 AM briefing via AIEngineClient', async () => {
    jest.spyOn(aiEngineClient, 'orchestrateAgent').mockResolvedValue({
      status: 'success',
      executive_role: 'ceo',
      target_departments: ['rnd', 'cfo', 'ops', 'logistics', 'cskh'],
      plan_steps: [
        { step: 1, agent: 'PlannerAgent', task: 'Deconstruct directive' }
      ],
      sub_agent_results: {
        rnd: { department: 'R&D', findings: 'All systems green' }
      },
      final_synthesis: '### 👑 Executive Briefing for CEO'
    });

    const result = await dailyBriefService.generateDailyBrief({
      userId: 'ceo_test',
      sendNotification: false
    });

    expect(result.success).toBe(true);
    expect(result.userId).toBe('ceo_test');
    expect(result.orchestration.executive_role).toBe('ceo');
    expect(result.orchestration.final_synthesis).toContain('Executive Briefing');
  });

  test('DailyBriefService generates weekly review report', async () => {
    jest.spyOn(aiEngineClient, 'orchestrateAgent').mockResolvedValue({
      status: 'success',
      final_synthesis: 'Weekly Review Summary'
    });

    const result = await dailyBriefService.generateWeeklyReview({ userId: 'ceo_test' });

    expect(result.success).toBe(true);
    expect(result.period).toBe('WEEKLY');
    expect(result.report).toBe('Weekly Review Summary');
  });
});
