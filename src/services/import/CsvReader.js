'use strict';

/**
 * CSV reader implementation.
 * Single responsibility: Parsing CSV buffers or text into structured row arrays.
 */
class CsvReader {
  /**
   * Reads a CSV buffer/string and returns array of rows.
   * @param {Buffer|string} input - CSV data
   * @param {object} [options={}]
   * @param {string} [options.delimiter=','] - Column delimiter
   * @param {boolean} [options.headerAsArray=true]
   * @returns {Array<any>}
   */
  read(input, { delimiter = ',', headerAsArray = true } = {}) {
    if (!input) {
      throw new Error('[CsvReader] Empty input provided for CSV parsing.');
    }
    const content = Buffer.isBuffer(input) ? input.toString('utf8') : String(input);
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

    const rows = lines.map((line) => {
      // Basic CSV splitting with quote handling
      const tokens = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          tokens.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      tokens.push(current.trim().replace(/^"|"$/g, ''));
      return tokens;
    });

    if (headerAsArray || rows.length === 0) {
      return rows;
    }

    const headers = rows[0];
    return rows.slice(1).map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
  }
}

module.exports = CsvReader;
