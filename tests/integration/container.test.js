'use strict';

const { createControllers } = require('@controllers/container');

describe('Container DI Wiring Integration', () => {
  let dummyPool;

  beforeEach(() => {
    dummyPool = {
      getConnection: jest.fn().mockResolvedValue({
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        execute: jest.fn().mockResolvedValue([[]]),
        query: jest.fn().mockResolvedValue([[]]),
      }),
      execute: jest.fn().mockResolvedValue([[]]),
      query: jest.fn().mockResolvedValue([[]]),
    };
  });

  it('initializes all controllers with proper dependency injection without throwing', () => {
    const controllers = createControllers({
      config: {
        serperApiKey: 'dummy',
        crawl4aiBaseUrl: 'http://localhost:11235',
        stagehand: {},
        orchestratorProductionEnabled: false,
        companyDashboardUrl: 'http://localhost:3000',
      },
      pool: dummyPool,
    });

    expect(controllers).toBeDefined();
    expect(controllers.web).toBeDefined();
    expect(controllers.approval).toBeDefined();
    expect(controllers.ceo).toBeDefined();
    expect(controllers.operator).toBeDefined();
    expect(controllers.dashboard).toBeDefined();
    expect(controllers.workspace).toBeDefined();
    expect(controllers.ceoPlanner).toBeDefined();
  });

  it('correctly wires ApprovalDecisionService with TransactionManager and factories', () => {
    const controllers = createControllers({
      config: {},
      pool: dummyPool,
    });

    const approvalController = controllers.approval;
    const approvalService = approvalController.approvalService;
    expect(approvalService).toBeDefined();
    expect(approvalService.transactionManager).toBeDefined();
    expect(typeof approvalService.approvalRepositoryFactory).toBe('function');
    expect(typeof approvalService.auditRepositoryFactory).toBe('function');
    expect(approvalService.allowedApproverIds.has('ceo')).toBe(true);
    expect(approvalService.allowedApproverIds.has('admin')).toBe(true);
  });

  it('correctly wires ReplayService with simulator and allowedOperatorIds', () => {
    const controllers = createControllers({
      config: {},
      pool: dummyPool,
    });

    const operatorController = controllers.operator;
    const replayService = operatorController.replayService;
    expect(replayService).toBeDefined();
    expect(replayService.simulator).toBeDefined();
    expect(typeof replayService.simulator.simulate).toBe('function');
    expect(replayService.allowedOperatorIds.has('operator')).toBe(true);
    expect(replayService.allowedOperatorIds.has('ceo')).toBe(true);
  });

  it('correctly wires CommandDispatcherService with handlers and allowedActorIds', () => {
    const controllers = createControllers({
      config: {},
      pool: dummyPool,
    });

    const ceoController = controllers.ceo;
    const dispatcher = ceoController.commandDispatcher;
    expect(dispatcher).toBeDefined();
    expect(dispatcher.allowedActorIds.has('ceo')).toBe(true);
    expect(typeof dispatcher.handlers['goal.create']).toBe('function');
    expect(typeof dispatcher.handlers['workflow.control']).toBe('function');
    expect(typeof dispatcher.handlers['approval.decide']).toBe('function');
  });
});
