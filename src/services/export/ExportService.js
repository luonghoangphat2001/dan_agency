'use strict';

const ExcelExporter = require('./ExcelExporter');
const CsvExporter = require('./CsvExporter');
const ExportFormat = require('@enums/export-format.enum');

/**
 * Shared Export Service providing a single standard entry point for all file export operations.
 * Uses ExportFormat enum and namespace contracts.
 */
class ExportService {
  /** @type {ExcelExporter} */
  #excelExporter;

  /** @type {CsvExporter} */
  #csvExporter;

  constructor(excelExporter = null, csvExporter = null) {
    this.#excelExporter = excelExporter || new ExcelExporter();
    this.#csvExporter = csvExporter || new CsvExporter();
  }

  /**
   * Export data into an Excel buffer.
   * @param {Array<any>} data
   * @param {object} [options={}]
   * @returns {Buffer}
   */
  exportExcel(data, options = {}) {
    return this.#excelExporter.export(data, options);
  }

  /**
   * Export data into a CSV buffer or string.
   * @param {Array<any>} data
   * @param {object} [options={}]
   * @returns {Buffer|string}
   */
  exportCsv(data, options = {}) {
    return this.#csvExporter.export(data, options);
  }

  /**
   * Export data into JSON buffer or string.
   * @param {Array<any>|object} data
   * @param {object} [options={}]
   * @param {boolean} [options.asBuffer=true]
   * @returns {Buffer|string}
   */
  exportJson(data, { asBuffer = true, space = 2 } = {}) {
    const jsonStr = JSON.stringify(data, null, space);
    return asBuffer ? Buffer.from(jsonStr, 'utf8') : jsonStr;
  }

  /**
   * Unified export dispatcher using ExportFormat enum.
   * @param {Array<any>|object} data
   * @param {string} [format=ExportFormat.EXCEL]
   * @param {object} [options={}]
   * @returns {Buffer|string}
   */
  export(data, format = ExportFormat.EXCEL, options = {}) {
    const normalizedFormat = String(format).toLowerCase().trim();
    if (normalizedFormat === ExportFormat.CSV) {
      return this.exportCsv(data, options);
    }
    if (normalizedFormat === ExportFormat.JSON) {
      return this.exportJson(data, options);
    }
    return this.exportExcel(data, options);
  }
}

module.exports = ExportService;
