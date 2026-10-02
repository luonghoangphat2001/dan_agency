'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const ToolRegistry = require('@services/agent/core/ToolRegistry');
const ReActEngine = require('@services/agent/core/ReActEngine');

describe('ReActEngine Execution & Self-Healing', () => {
  class FlakyTool extends BaseTool {
    constructor() {
      super('flaky_tool', 'Công cụ thử nghiệm có thể gặp lỗi.', z.object({ attempt: z.number() }));
      this.calls = 0;
    }

    async execute(parameters) {
      this.calls++;
      if (parameters.attempt === 1) {
        throw new Error('Kết nối cơ sở dữ liệu tạm thời gián đoạn!');
      }
      return { status: 'success', data: 'Dữ liệu đã được nạp thành công ở lần 2' };
    }
  }

  test('ReActEngine executes single-shot text answer without tools', async () => {
    const mockProvider = {
      chatWithTools: jest.fn().mockResolvedValue({
        type: 'text',
        text: 'Xin chào, tôi là Dan AI Agent!',
        tokensIn: 10,
        tokensOut: 20
      })
    };

    const toolRegistry = new ToolRegistry();
    const engine = new ReActEngine({
      provider: mockProvider,
      toolRegistry,
      stateRepository: null
    });

    const executionResponse = await engine.run({
      userId: 'test_user',
      prompt: 'Chào bạn',
      systemPrompt: 'Test'
    });

    expect(executionResponse.answer).toBe('Xin chào, tôi là Dan AI Agent!');
    expect(executionResponse.totalSteps).toBe(1);
  });

  test('ReActEngine handles tool call and recovers via Self-Healing when tool throws', async () => {
    const tool = new FlakyTool();
    const toolRegistry = new ToolRegistry();
    toolRegistry.register(tool);

    let currentStep = 0;
    const mockProvider = {
      chatWithTools: jest.fn().mockImplementation(async (messages) => {
        currentStep++;
        if (currentStep === 1) {
          // LLM calls flaky tool with attempt 1 (fails)
          return {
            type: 'tool_calls',
            toolCalls: [{ id: 'call_1', name: 'flaky_tool', parameters: { attempt: 1 } }],
            tokensIn: 20,
            tokensOut: 15
          };
        }
        if (currentStep === 2) {
          // Check that the error was received in tool_result history!
          const lastMessage = messages[messages.length - 1];
          expect(lastMessage.role).toBe('tool_result');
          expect(lastMessage.results[0].content).toContain('Lỗi');

          // LLM sees error and retries with attempt 2 (succeeds)
          return {
            type: 'tool_calls',
            toolCalls: [{ id: 'call_2', name: 'flaky_tool', parameters: { attempt: 2 } }],
            tokensIn: 30,
            tokensOut: 15
          };
        }
        // Step 3: LLM provides final synthesis
        return {
          type: 'text',
          text: 'Tác vụ đã hoàn tất thành công sau khi tự khắc phục lỗi!',
          tokensIn: 40,
          tokensOut: 25
        };
      })
    };

    const recordedEvents = [];
    const engine = new ReActEngine({
      provider: mockProvider,
      toolRegistry,
      stateRepository: null,
      options: { maximumSteps: 5 }
    });

    const executionResponse = await engine.run({
      userId: 'test_user',
      prompt: 'Hãy chạy thử tác vụ',
      systemPrompt: 'Test',
      onEvent: (eventItem) => recordedEvents.push(eventItem)
    });

    expect(tool.calls).toBe(2);
    expect(executionResponse.answer).toBe('Tác vụ đã hoàn tất thành công sau khi tự khắc phục lỗi!');
    expect(executionResponse.totalSteps).toBe(3);
    expect(recordedEvents.some(eventItem => eventItem.type === 'tool_end' && eventItem.isError === true)).toBe(true);
  });
});
