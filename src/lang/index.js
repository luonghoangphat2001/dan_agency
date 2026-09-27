import { ref } from 'vue';

import vietnameseCommonTranslations from '@lang/vi/common.json';
import vietnameseAuthTranslations from '@lang/vi/auth.json';
import vietnameseLearningTranslations from '@lang/vi/learning.json';

import englishCommonTranslations from '@lang/en/common.json';
import englishAuthTranslations from '@lang/en/auth.json';
import englishLearningTranslations from '@lang/en/learning.json';

const translationDictionaries = {
  vi: {
    common: vietnameseCommonTranslations,
    auth: vietnameseAuthTranslations,
    learning: vietnameseLearningTranslations
  },
  en: {
    common: englishCommonTranslations,
    auth: englishAuthTranslations,
    learning: englishLearningTranslations
  }
};

const DEFAULT_LOCALE = 'vi';
const persistedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('app_locale') : null;
export const currentLocale = ref(persistedLocale && translationDictionaries[persistedLocale] ? persistedLocale : DEFAULT_LOCALE);

/**
 * Switch active application locale and persist to localStorage
 * @param {string} newLocaleCode
 */
export function setLocale(newLocaleCode) {
  if (translationDictionaries[newLocaleCode]) {
    currentLocale.value = newLocaleCode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app_locale', newLocaleCode);
    }
  }
}

/**
 * Translate a dot-notated key with optional interpolation parameters
 * @param {string} translationKey
 * @param {Record<string, string|number>} [interpolationParameters={}]
 * @param {string|null} [targetLocaleOverride=null]
 * @returns {string}
 */
export function translate(translationKey, interpolationParameters = {}, targetLocaleOverride = null) {
  const selectedLocale = targetLocaleOverride || currentLocale.value || DEFAULT_LOCALE;
  const activeDictionary = translationDictionaries[selectedLocale] || translationDictionaries[DEFAULT_LOCALE] || {};

  const keySegments = String(translationKey || '').split('.');
  let resolvedValue = activeDictionary;

  for (const segment of keySegments) {
    if (resolvedValue && typeof resolvedValue === 'object' && segment in resolvedValue) {
      resolvedValue = resolvedValue[segment];
    } else {
      resolvedValue = null;
      break;
    }
  }

  // Fallback to default locale if missing in selected locale
  if (typeof resolvedValue !== 'string' && selectedLocale !== DEFAULT_LOCALE) {
    let fallbackDictionary = translationDictionaries[DEFAULT_LOCALE];
    for (const segment of keySegments) {
      if (fallbackDictionary && typeof fallbackDictionary === 'object' && segment in fallbackDictionary) {
        fallbackDictionary = fallbackDictionary[segment];
      } else {
        fallbackDictionary = null;
        break;
      }
    }
    if (typeof fallbackDictionary === 'string') {
      resolvedValue = fallbackDictionary;
    }
  }

  if (typeof resolvedValue !== 'string') {
    return translationKey;
  }

  let formattedText = resolvedValue;
  for (const [parameterName, parameterValue] of Object.entries(interpolationParameters)) {
    formattedText = formattedText
      .replace(new RegExp(`\\{${parameterName}\\}`, 'g'), String(parameterValue))
      .replace(new RegExp(`:${parameterName}\\b`, 'g'), String(parameterValue));
  }

  return formattedText;
}

export function useI18n() {
  return {
    locale: currentLocale,
    setLocale,
    translate
  };
}

export default {
  install(vueApp) {
    vueApp.config.globalProperties.$translate = translate;
    vueApp.provide('i18n', {
      locale: currentLocale,
      setLocale,
      translate
    });
  }
};
