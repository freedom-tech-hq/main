import type { LocalizationConfig } from 'freedom-localization';
import { makeLoadNamespaceForLanguage } from 'freedom-localization';
import * as i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next';

let globalT = i18next.t;

export const init = async (config: LocalizationConfig) => {
  globalT = await i18next
    .use(LanguageDetector)
    .use(resourcesToBackend(makeLoadNamespaceForLanguage()))
    .use(initReactI18next)
    .init({
      defaultNS: 'default',
      supportedLngs: config.supportedLanguages,
      fallbackLng: config.defaultLanguage,
      nsSeparator: '::',
      react: { useSuspense: false },
      interpolation: { escapeValue: false },
      nonExplicitSupportedLngs: true
    });
  return globalT;
};

export const getDefaultT = () => globalT;
