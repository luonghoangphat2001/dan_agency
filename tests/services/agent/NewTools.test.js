'use strict';

const SaveMemoryTool = require('@services/agent/tools/SaveMemoryTool');
const RecallMemoryTool = require('@services/agent/tools/RecallMemoryTool');
const OpenClawScraperTool = require('@services/agent/tools/OpenClawScraperTool');
const ExecutiveReportTool = require('@services/agent/tools/ExecutiveReportTool');
const SystemHealthTool = require('@services/agent/tools/SystemHealthTool');

describe('New Agent Tools Suite', () => {
  describe('SaveMemoryTool & RecallMemoryTool', () => {
    it('should validate parameters and execute save_memory tool with mocked DB', async () => {
      const mockDb = {
        query: jest.fn().mockResolvedValue([{ affectedRows: 1 }])
      };
      const tool = new SaveMemoryTool(mockDb);

      expect(tool.name).toBe('save_memory');
      const params = tool.validateParameters({ key: 'fav_model', value: 'claude-3.7' });
      expect(params).toEqual({ key: 'fav_model', value: 'claude-3.7' });

      const result = await tool.execute(params, { userId: 'u123', platform: 'discord' });
      expect(result.success).toBe(true);
      expect(mockDb.query).toHaveBeenCalled();
    });

    it('should execute recall_memory tool and filter memories', async () => {
      const mockDb = {
        query: jest.fn().mockResolvedValue([
          { mem_key: 'fav_model', mem_value: 'claude-3.7', updated_at: '2026-10-05' },
          { mem_key: 'timezone', mem_value: 'Asia/Ho_Chi_Minh', updated_at: '2026-10-05' }
        ])
      };
      const tool = new RecallMemoryTool(mockDb);

      expect(tool.name).toBe('recall_memory');
      const result = await tool.execute({ queryKey: 'model' }, { userId: 'u123', platform: 'discord' });
      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(result.memories[0].key).toBe('fav_model');
    });
  });

  describe('ExecutiveReportTool', () => {
    it('should format executive summary card with metrics and recommendations', async () => {
      const tool = new ExecutiveReportTool();
      expect(tool.name).toBe('executive_report');

      const result = await tool.execute({
        title: 'Q3 Financial Health',
        summary: 'Revenue increased by 25%.',
        metrics: [{ label: 'Revenue', value: '$50,000', status: 'ok' }],
        recommendations: ['Maintain current API quota.']
      });

      expect(result.success).toBe(true);
      expect(result.formattedReport).toContain('### 📊 Q3 Financial Health');
      expect(result.formattedReport).toContain('Revenue');
      expect(result.formattedReport).toContain('Maintain current API quota.');
    });
  });

  describe('SystemHealthTool', () => {
    it('should inspect system memory, uptime, and database connectivity', async () => {
      const tool = new SystemHealthTool();
      expect(tool.name).toBe('system_health');

      const mockDb = { query: jest.fn().mockResolvedValue([{ '1': 1 }]) };
      const result = await tool.execute({ checkDatabase: true }, { database: mockDb });

      expect(result.success).toBe(true);
      expect(result.health.platform).toBeDefined();
      expect(result.health.databaseStatus).toBe('online');
    });
  });

  describe('OpenClawScraperTool', () => {
    it('should format parameters for OpenClaw scraper call', async () => {
      const tool = new OpenClawScraperTool('http://127.0.0.1:4000');
      expect(tool.name).toBe('openclaw_scrape');

      const params = tool.validateParameters({ url: 'https://example.com', selector: 'h1' });
      expect(params.url).toBe('https://example.com');
      expect(params.selector).toBe('h1');
    });
  });
});
