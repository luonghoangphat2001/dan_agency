/**
 * @fileoverview classifier.service - Provides classifier functionality.
 */
'use strict';

/**
 * ClassifierService
 * Manages classifier logic.
 */
class ClassifierService {
  /**
   * classifyOutput - Executes classify output.
   * @param {*} text - Input parameter.
   * @param {*} confidenceScore - Input parameter.
   * @returns {*} Result of operation.
   */
  classifyOutput({ text = '', confidenceScore = 1.0 }) {
    const normalizedText = (text || '').toLowerCase();
    let category = 'INFERENCE';
    if (
      text.startsWith('FACT:') ||
      normalizedText.includes('dữ liệu từ ssot') ||
      normalizedText.includes('data from ssot') ||
      normalizedText.includes('from ssot')
    ) {
      category = 'FACT';
    } else if (
      text.startsWith('RECOMMENDATION:') ||
      normalizedText.includes('đề xuất') ||
      normalizedText.includes('propose') ||
      normalizedText.includes('recommend')
    ) {
      category = 'RECOMMENDATION';
    }

    return Object.freeze({
      text,
      category,
      confidenceScore,
      classifiedAt: new Date().toISOString(),
    });
  }
}

module.exports = ClassifierService;
