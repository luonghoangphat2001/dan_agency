'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Localization (i18n) manager.
 * Provides centralized string translation without hardcoded strings in business logic.
 */
class LocalizationService {
  /** @type {Map<string, Record<string, any>>} */
  #translations = new Map();
  /** @type {string} */
  #defaultLocale = 'vi';

  constructor() {
    this.#loadTranslations();
  }

  #loadTranslations() {
    const supportedLocales = ['vi', 'en'];
    for (const locale of supportedLocales) {
      const localeDirectory = path.join(__dirname, locale);
      if (!fs.existsSync(localeDirectory)) {
        continue;
      }

      const files = fs.readdirSync(localeDirectory);
      const combined = {};

      for (const file of files) {
        if (file.endsWith('.json')) {
          const namespace = path.basename(file, '.json');
          try {
            const filePath = path.join(localeDirectory, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            combined[namespace] = content;
          } catch (error) {
            console.error(`[LocalizationService] Failed to load ${file} for locale ${locale}:`, error.message);
          }
        }
      }

      this.#translations.set(locale, combined);
    }
  }

  /**
   * Translates a dot-notated key.
   * Example: translate('agent.tools.mysql_query.name', {}, 'vi')
   *
   * @param {string} key
   * @param {Record<string, any>} [parameters={}]
   * @param {string} [locale]
   * @returns {string}
   */
  translate(key, parameters = {}, locale = null) {
    const targetLocale = locale || this.#defaultLocale;
    const dictionary = this.#translations.get(targetLocale) || this.#translations.get(this.#defaultLocale) || {};

    const keys = key.split('.');
    let value = dictionary;

    for (const segment of keys) {
      if (value && typeof value === 'object' && segment in value) {
        value = value[segment];
      } else {
        value = null;
        break;
      }
    }

    if (typeof value !== 'string') {
      // Fallback: return key if translation missing
      return key;
    }

    // Replace {parameterName} and :parameterName placeholders
    let formattedText = value;
    for (const [parameterKey, parameterValue] of Object.entries(parameters)) {
      formattedText = formattedText
        .replace(new RegExp(`\\{${parameterKey}\\}`, 'g'), String(parameterValue))
        .replace(new RegExp(`:${parameterKey}\\b`, 'g'), String(parameterValue));
    }

    return formattedText;
  }

  /**
   * Shorthand helper for translate
   */
  t(key, parameters = {}, locale = null) {
    return this.translate(key, parameters, locale);
  }
}

const defaultInstance = new LocalizationService();

module.exports = defaultInstance;
module.exports.LocalizationService = LocalizationService;
