'use strict';

const CeoController = require('@controllers/CeoController');

describe('CeoController', () => {
  let mockDailyBriefService;
  let mockAiEngineClient;
  let mockOpenClawService;
  let controller;
  let res;

  beforeEach(() => {
    mockDailyBriefService = {
      generateDailyBrief: jest.fn().mockResolvedValue({
        success: true,
        userId: 'ceo',
        orchestration: { final_synthesis: 'Daily briefing content' },
        notificationSent: true,
      }),
    };

    mockAiEngineClient = {
      orchestrateAgent: jest.fn().mockResolvedValue({
        status: 'success',
        executive_role: 'ceo',
        final_synthesis: 'Orchestration complete',
      }),
    };

    mockOpenClawService = {
      listApprovals: jest.fn().mockResolvedValue({
        items: [{ id: 'app_1', title: 'Approval 1', status: 'pending' }],
      }),
      decideApproval: jest.fn().mockResolvedValue({
        approval: { approval_id: 'app_1', status: 'consumed' },
      }),
    };

    controller = new CeoController({
      dailyBriefService: mockDailyBriefService,
      aiEngineClient: mockAiEngineClient,
      openClawService: mockOpenClawService,
    });

    res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
  });

  test('getDailyBrief calls dailyBriefService with user and notification flag', async () => {
    const req = { user: { id: 'ceo_dan' }, query: { notify: 'true' } };
    const next = jest.fn();

    await controller.getDailyBrief(req, res, next);

    expect(mockDailyBriefService.generateDailyBrief).toHaveBeenCalledWith({
      userId: 'ceo_dan',
      sendNotification: true,
    });
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.message).toBe('Daily briefing generated successfully.');
  });

  test('orchestrate calls aiEngineClient with prompt and role', async () => {
    const req = {
      user: { id: 'ceo_dan' },
      body: { prompt: 'Audit financial risks', executiveRole: 'cfo' },
    };
    const next = jest.fn();

    await controller.orchestrate(req, res, next);

    expect(mockAiEngineClient.orchestrateAgent).toHaveBeenCalledWith({
      prompt: 'Audit financial risks',
      userId: 'ceo_dan',
      executiveRole: 'cfo',
    });
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
  });

  test('getExceptionInbox returns items from openClawService if available', async () => {
    const req = { user: { id: 'ceo_dan' } };
    const next = jest.fn();

    await controller.getExceptionInbox(req, res, next);

    expect(mockOpenClawService.listApprovals).toHaveBeenCalledWith({ status: 'pending', limit: 20 });
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.exceptions).toHaveLength(1);
    expect(res.jsonData.count).toBe(1);
  });

  test('processApproval validates payload and forwards to openClawService', async () => {
    const req = {
      user: { id: 'ceo_dan' },
      body: { approvalId: 'app_1', decision: 'approve', reason: 'Verified KPI' },
    };
    const next = jest.fn();

    await controller.processApproval(req, res, next);

    expect(mockOpenClawService.decideApproval).toHaveBeenCalledWith('app_1', {
      decision: 'approve',
      actorId: 'ceo_dan',
      reason: 'Verified KPI',
    });
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.status).toBe('PROCESSED');
    expect(res.jsonData.approvalId).toBe('app_1');
  });

  test('processApproval returns badRequest when required fields are missing', async () => {
    const req = { user: { id: 'ceo_dan' }, body: { reason: 'No decision given' } };
    const next = jest.fn();

    await controller.processApproval(req, res, next);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('approvalId and decision are required.');
  });
});

