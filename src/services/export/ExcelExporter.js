'use strict';

const XLSX = require('xlsx');

/**
 * Excel exporter component using SheetJS.
 * Single responsibility: Converting array data/objects into Excel buffers.
 */
class ExcelExporter {
  /**
   * Export JSON array or 2D array of rows into Excel buffer.
   * @param {Array<object>|Array<Array<any>>} data - Records or row arrays
   * @param {object} [options={}]
   * @param {string} [options.sheetName='Sheet1']
   * @param {boolean} [options.isAoa=false] - True if data is Array-of-Arrays (2D array)
   * @returns {Buffer}
   */
  export(data, { sheetName = 'Sheet1', isAoa = false } = {}) {
    if (!Array.isArray(data)) {
      throw new Error('[ExcelExporter] Export payload must be an array.');
    }

    const worksheet = isAoa
      ? XLSX.utils.aoa_to_sheet(data)
      : XLSX.utils.json_to_sheet(data);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}

module.exports = ExcelExporter;
