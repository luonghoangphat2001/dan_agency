'use strict';

const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');

/**
 * Tool for formatting structured executive markdown cards and summaries for CEO.
 */
class ExecutiveReportTool extends BaseTool {
  constructor() {
    const schema = z.object({
      title: z.string().min(1).describe('Title of the executive report card'),
      summary: z.string().min(1).describe('Executive summary paragraph'),
      metrics: z.array(z.object({
        label: z.string(),
        value: z.string(),
        status: z.enum(['ok', 'warning', 'critical']).optional()
      })).optional().describe('Key metric indicators'),
      recommendations: z.array(z.string()).optional().describe('Actionable recommendations for CEO')
    });

    super(
      'executive_report',
      'Formats key business metrics, risks, and recommendations into an executive summary report.',
      schema
    );
  }

  async execute(parameters, _context = {}) {
    const { title, summary, metrics = [], recommendations = [] } = parameters;

    let markdown = `### 📊 ${title}\n\n${summary}\n\n`;

    if (metrics.length > 0) {
      markdown += `| Chỉ số | Giá trị | Trạng thái |\n| :--- | :--- | :---: |\n`;
      for (const m of metrics) {
        const icon = m.status === 'critical' ? '🔴' : m.status === 'warning' ? '🟡' : '🟢';
        markdown += `| **${m.label}** | ${m.value} | ${icon} |\n`;
      }
      markdown += `\n`;
    }

    if (recommendations.length > 0) {
      markdown += `#### 💡 Đề xuất hành động:\n`;
      for (const rec of recommendations) {
        markdown += `- ${rec}\n`;
      }
    }

    return {
      success: true,
      formattedReport: markdown
    };
  }
}

module.exports = ExecutiveReportTool;
