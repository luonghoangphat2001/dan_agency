'use strict';

const { DailyBriefService } = require('@services/agent/DailyBriefService');

describe('DailyBriefService Unit Tests', () => {
  let mockAiEngineClient;
  let mockDiscordService;
  let service;

  beforeEach(() => {
    mockAiEngineClient = {
      orchestrateAgent: jest.fn().mockResolvedValue({
        status: 'success',
        executive_role: 'ceo',
        final_synthesis: '### Executive Briefing Details',
      }),
    };

    mockDiscordService = {
      enqueue: jest.fn().mockResolvedValue({ id: 101, duplicate: false }),
    };

    service = new DailyBriefService({
      aiEngineClient: mockAiEngineClient,
      discordNotificationService: mockDiscordService,
    });
  });

  test('generateDailyBrief with sendNotification=true enqueues notification via Discord service', async () => {
    const result = await service.generateDailyBrief({
      userId: 'ceo_user_1',
      sendNotification: true,
    });

    expect(result.success).toBe(true);
    expect(result.notificationSent).toBe(true);
    expect(mockAiEngineClient.orchestrateAgent).toHaveBeenCalledWith({
      prompt: expect.any(String),
      userId: 'ceo_user_1',
      executiveRole: 'ceo',
    });

    expect(mockDiscordService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('daily-brief:ceo_user_1:'),
        source: 'daily_brief',
        severity: 'info',
        title: expect.stringContaining('👑 Dan AI CEO Executive Daily Briefing'),
        message: '### Executive Briefing Details',
      })
    );
  });

  test('generateDailyBrief does not enqueue notification when sendNotification=false', async () => {
    const result = await service.generateDailyBrief({
      userId: 'ceo_user_1',
      sendNotification: false,
    });

    expect(result.success).toBe(true);
    expect(result.notificationSent).toBe(false);
    expect(mockDiscordService.enqueue).not.toHaveBeenCalled();
  });
});

