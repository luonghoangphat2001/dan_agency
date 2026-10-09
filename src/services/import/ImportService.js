'use strict';

const ExcelReader = require('./ExcelReader');
const CsvReader = require('./CsvReader');
const ImportFormat = require('@enums/import-format.enum');

/**
 * Shared Import Service providing a single standard entry point for all file import operations.
 * Uses ImportFormat enum and namespace contracts.
 */
class ImportService {
  /** @type {ExcelReader} */
  #excelReader;

  /** @type {CsvReader} */
  #csvReader;

  constructor(excelReader = null, csvReader = null) {
    this.#excelReader = excelReader || new ExcelReader();
    this.#csvReader = csvReader || new CsvReader();
  }

  /**
   * Imports rows from an Excel buffer.
   * @param {Buffer} buffer
   * @param {object} [options={}]
   * @returns {Array<any>}
   */
  importExcel(buffer, options = {}) {
    return this.#excelReader.read(buffer, options);
  }

  /**
   * Imports rows from a CSV buffer or string.
   * @param {Buffer|string} input
   * @param {object} [options={}]
   * @returns {Array<any>}
   */
  importCsv(input, options = {}) {
    return this.#csvReader.read(input, options);
  }

  /**
   * Unified file import dispatcher using ImportFormat enum.
   * @param {Buffer|string} fileContent
   * @param {string} [format=ImportFormat.EXCEL]
   * @param {object} [options={}]
   * @returns {Array<any>}
   */
  import(fileContent, format = ImportFormat.EXCEL, options = {}) {
    const normalizedFormat = String(format).toLowerCase().trim();
    if (normalizedFormat === ImportFormat.CSV) {
      return this.importCsv(fileContent, options);
    }
    if (normalizedFormat === ImportFormat.JSON) {
      const content = Buffer.isBuffer(fileContent) ? fileContent.toString('utf8') : String(fileContent);
      return JSON.parse(content);
    }
    return this.importExcel(fileContent, options);
  }
}

module.exports = ImportService;
