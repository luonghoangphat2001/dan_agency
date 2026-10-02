'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const ToolAdapter = require('@services/agent/core/ToolAdapter');
const ToolRegistry = require('@services/agent/core/ToolRegistry');
const MySQLQueryTool = require('@services/agent/tools/MySQLQueryTool');

describe('Agent Core Tool System', () => {
  class TestCalculatorTool extends BaseTool {
    constructor() {
      super(
        'calculator',
        'Thực hiện phép tính cộng hai số nguyên.',
        z.object({
          a: z.number().describe('Số thứ nhất'),
          b: z.number().describe('Số thứ hai')
        })
      );
    }

    async execute(parameters) {
      return { result: parameters.a + parameters.b };
    }
  }

  test('BaseTool rejects direct instantiation', () => {
    expect(() => new BaseTool('test', 'desc', z.object({}))).toThrow(TypeError);
  });

  test('BaseTool validates input using Zod correctly', () => {
    const calculatorTool = new TestCalculatorTool();
    const validParameters = calculatorTool.validateParameters({ a: 10, b: 20 });
    expect(validParameters).toEqual({ a: 10, b: 20 });

    // Should throw if parameter is not a number
    expect(() => calculatorTool.validateParameters({ a: 'not-a-number', b: 20 })).toThrow();
  });

  test('ToolAdapter converts schema to OpenAI, Gemini, Claude format', () => {
    const calculatorTool = new TestCalculatorTool();

    const openAiFormat = ToolAdapter.toOpenAI(calculatorTool);
    expect(openAiFormat.type).toBe('function');
    expect(openAiFormat.function.name).toBe('calculator');
    expect(openAiFormat.function.parameters.properties).toHaveProperty('a');

    const geminiFormat = ToolAdapter.toGemini(calculatorTool);
    expect(geminiFormat.name).toBe('calculator');
    expect(geminiFormat.parameters.properties).toHaveProperty('a');
    expect(geminiFormat.parameters).not.toHaveProperty('$schema');

    const claudeFormat = ToolAdapter.toClaude(calculatorTool);
    expect(claudeFormat.name).toBe('calculator');
    expect(claudeFormat.input_schema.properties).toHaveProperty('b');
  });

  test('ToolRegistry registers and executes tools with runtime validation', async () => {
    const registry = new ToolRegistry();
    const calculatorTool = new TestCalculatorTool();
    registry.register(calculatorTool);

    expect(registry.has('calculator')).toBe(true);
    expect(registry.getNames()).toContain('calculator');

    // Valid execution
    const executionResult = await registry.execute('calculator', { a: 15, b: 25 });
    expect(executionResult).toEqual({ result: 40 });

    // Invalid execution (throws ZodError)
    await expect(registry.execute('calculator', { a: 'invalid' })).rejects.toThrow();

    // Unknown tool
    await expect(registry.execute('unknown_tool', {})).rejects.toThrow();
  });

  test('MySQLQueryTool enforces strict Read-Only guardrails', async () => {
    const mockDatabase = { query: jest.fn().mockResolvedValue([{ id: 1, name: 'dan' }]) };
    const sqlTool = new MySQLQueryTool(mockDatabase);

    // Permitted queries
    await sqlTool.execute({ sql: 'SELECT * FROM users', reason: 'Tra cứu danh sách user' });
    expect(mockDatabase.query).toHaveBeenCalledWith('SELECT * FROM users LIMIT 50');

    // Forbidden queries
    await expect(sqlTool.execute({ sql: 'DELETE FROM users WHERE id = 1', reason: 'test' })).rejects.toThrow();
    await expect(sqlTool.execute({ sql: 'DROP TABLE users', reason: 'test' })).rejects.toThrow();
    await expect(sqlTool.execute({ sql: 'UPDATE users SET name = "hacked"', reason: 'test' })).rejects.toThrow();
    await expect(sqlTool.execute({ sql: 'SELECT 1; DROP TABLE users', reason: 'test' })).rejects.toThrow();
  });
});
