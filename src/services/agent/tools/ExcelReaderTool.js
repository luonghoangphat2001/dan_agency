'use strict';

const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { z } = require('zod');
const BaseTool = require('@services/agent/core/BaseTool');
const localization = require('@lang');

/**
 * Tool for parsing and extracting data from Excel (.xlsx, .xls, .csv) files.
 */
class ExcelReaderTool extends BaseTool {
  constructor() {
    const schema = z.object({
      filePath: z.string().describe(localization.t('agent.tools.excel_reader.schema_file_path')),
      sheetName: z.string().optional().describe(localization.t('agent.tools.excel_reader.schema_sheet_name')),
      limitRows: z.number().int().min(1).max(100).default(20).describe(localization.t('agent.tools.excel_reader.schema_limit_rows'))
    });

    super(
      'excel_reader',
      localization.t('agent.tools.excel_reader.description'),
      schema
    );
  }

  async execute(parameters, context = {}) {
    const resolvedPath = path.resolve(parameters.filePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(localization.t('agent.tools.excel_reader.error_file_not_found', { filePath: parameters.filePath }));
    }

    try {
      const workbook = xlsx.readFile(resolvedPath);
      const sheetNames = workbook.SheetNames;
      if (!sheetNames || sheetNames.length === 0) {
        throw new Error(localization.t('agent.tools.excel_reader.error_empty_workbook'));
      }

      const targetSheet = parameters.sheetName && sheetNames.includes(parameters.sheetName)
        ? parameters.sheetName
        : sheetNames[0];

      const worksheet = workbook.Sheets[targetSheet];
      const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: '' });
      const totalRows = rawData.length;
      const sampledRows = rawData.slice(0, parameters.limitRows);

      return {
        success: true,
        sheetNames,
        currentSheet: targetSheet,
        totalRows,
        sampledRowsCount: sampledRows.length,
        data: sampledRows
      };
    } catch (error) {
      return {
        success: false,
        error: localization.t('agent.tools.excel_reader.error_read_failed', { errorMessage: error.message })
      };
    }
  }
}

module.exports = ExcelReaderTool;
