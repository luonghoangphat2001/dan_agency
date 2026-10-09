'use strict';

/**
 * CSV exporter component.
 * Single responsibility: Converting array data/objects into CSV string/buffer.
 */
class CsvExporter {
  /**
   * Exports array of objects or 2D array into CSV string or buffer.
   * @param {Array<object>|Array<Array<any>>} data
   * @param {object} [options={}]
   * @param {string} [options.delimiter=',']
   * @param {boolean} [options.asBuffer=true]
   * @returns {Buffer|string}
   */
  export(data, { delimiter = ',', asBuffer = true } = {}) {
    if (!Array.isArray(data) || data.length === 0) {
      const empty = '';
      return asBuffer ? Buffer.from(empty, 'utf8') : empty;
    }

    let csvContent = '';
    const isAoa = Array.isArray(data[0]);

    if (isAoa) {
      csvContent = data
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(delimiter))
        .join('\n');
    } else {
      const headers = Object.keys(data[0]);
      const headerLine = headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(delimiter);
      const rowLines = data.map((row) =>
        headers
          .map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`)
          .join(delimiter)
      );
      csvContent = [headerLine, ...rowLines].join('\n');
    }

    return asBuffer ? Buffer.from(csvContent, 'utf8') : csvContent;
  }
}

module.exports = CsvExporter;
