'use strict';

const XLSX = require('xlsx');

/**
 * Excel reader implementation using SheetJS (xlsx).
 * Single responsibility: Parsing Excel buffers into structured row arrays or JSON objects.
 */
class ExcelReader {
  /**
   * Reads an Excel buffer and returns rows.
   * @param {Buffer} buffer - Excel file buffer
   * @param {object} [options={}]
   * @param {string|null} [options.sheetName=null] - Specific sheet name to read (defaults to first sheet)
   * @param {boolean} [options.headerAsArray=true] - If true, returns array of row arrays; if false, returns objects array with header keys
   * @param {any} [options.defaultValue=''] - Default value for empty cells
   * @returns {Array<any>} Array of rows
   */
  read(buffer, { sheetName = null, headerAsArray = true, defaultValue = '' } = {}) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('[ExcelReader] Invalid file buffer provided for Excel parsing.');
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const targetSheetName = sheetName || workbook.SheetNames[0];

    if (!targetSheetName || !workbook.Sheets[targetSheetName]) {
      throw new Error(`[ExcelReader] Sheet "${targetSheetName}" not found in workbook.`);
    }

    const sheet = workbook.Sheets[targetSheetName];
    if (headerAsArray) {
      return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: defaultValue });
    }

    return XLSX.utils.sheet_to_json(sheet, { defval: defaultValue });
  }

  /**
   * Returns available sheet names in the workbook.
   * @param {Buffer} buffer
   * @returns {string[]}
   */
  getSheetNames(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('[ExcelReader] Invalid file buffer provided.');
    }
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    return workbook.SheetNames || [];
  }
}

module.exports = ExcelReader;
