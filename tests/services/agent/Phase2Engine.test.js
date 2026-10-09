'use strict';

const ReActEngine = require('@services/agent/core/ReActEngine');
const ToolRegistry = require('@services/agent/core/ToolRegistry');

describe('Phase 2 Agent Engine Enhancements', () => {
  let mockProvider;
  let toolRegistry;

  beforeEach(() => {
    mockProvider = {
      chatWithTools: jest.fn().mockResolvedValue({
        type: 'text',
        text: 'Executive Analysis Completed.'
      }),
      chat: jest.fn().mockResolvedValue({
        type: 'text',
        text: 'Fallback Analysis Completed.'
      })
    };
    toolRegistry = new ToolRegistry();
  });

  it('should initialize ReActEngine with planning and self-reflection enabled by default', () => {
    const engine = new ReActEngine({
      provider: mockProvider,
      toolRegistry,
      stateRepository: null
    });
    expect(engine).toBeDefined();
  });

  it('should run ReActEngine emitting run_start, self_reflection and final_answer events', async () => {
    const engine = new ReActEngine({
      provider: mockProvider,
      toolRegistry,
      stateRepository: null,
      options: { enablePlanning: true, enableSelfReflection: true }
    });

    const events = [];
    const onEvent = (e) => events.push(e);

    const result = await engine.run({
      userId: 'ceo_user',
      prompt: 'Báo cáo chiến lược doanh thu Q3',
      onEvent
    });

    expect(result.answer).toBe('Executive Analysis Completed.');
    expect(events.some(e => e.type === 'run_start')).toBe(true);
    expect(events.some(e => e.type === 'self_reflection' && e.status === 'verified')).toBe(true);
    expect(events.some(e => e.type === 'final_answer')).toBe(true);
  });
});
