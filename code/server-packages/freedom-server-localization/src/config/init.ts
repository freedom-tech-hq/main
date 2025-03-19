import { type LocalizationConfig, makeLoadNamespaceForLanguage } from 'freedom-localization';
import { t, use } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

let globalT = t;

export const init = async (config: LocalizationConfig) => {
  globalT = await use(resourcesToBackend(makeLoadNamespaceForLanguage())).init({
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
