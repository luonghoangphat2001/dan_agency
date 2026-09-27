'use strict';

const fs = require('fs');
const path = require('path');

class LocalizationService {
  #translations = new Map();
  #defaultLocale = 'vi';

  constructor() {
    this.#loadTranslations();
  }

  #loadTranslations() {
    const supportedLocales = ['vi', 'en'];
    for (const locale of supportedLocales) {
      const localeDirectory = path.join(__dirname, locale);
      if (!fs.existsSync(localeDirectory)) continue;

      const files = fs.readdirSync(localeDirectory);
      const combined = {};

      for (const file of files) {
        if (file.endsWith('.json')) {
          const namespace = path.basename(file, '.json');
          try {
            const filePath = path.join(localeDirectory, file);
            combined[namespace] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          } catch (error) {
            console.error(`[LocalizationService] Failed to load ${file}:`, error.message);
          }
        }
      }

      this.#translations.set(locale, combined);
    }
  }

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

    if (typeof value !== 'string') return key;

    let formattedText = value;
    for (const [parameterKey, parameterValue] of Object.entries(parameters)) {
      formattedText = formattedText
        .replace(new RegExp(`\\{${parameterKey}\\}`, 'g'), String(parameterValue))
        .replace(new RegExp(`:${parameterKey}\\b`, 'g'), String(parameterValue));
    }

    return formattedText;
  }

  t(key, parameters = {}, locale = null) {
    return this.translate(key, parameters, locale);
  }
}

module.exports = new LocalizationService();
