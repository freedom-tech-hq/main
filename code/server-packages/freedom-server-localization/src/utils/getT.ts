import { inline, makeAsyncFunc } from 'freedom-async';
import { getSupportedNamespaces } from 'freedom-localization';
import { changeLanguage, loadLanguages, loadNamespaces, type TFunction } from 'i18next';

import { getDefaultT } from '../config/init.ts';

const globalCacheByLocaleCode: Partial<Record<string, Promise<TFunction>>> = {};

export const getT = makeAsyncFunc([import.meta.filename], async (_trace, localeCode: string): Promise<TFunction> => {
  const cached = globalCacheByLocaleCode[localeCode];
  if (cached !== undefined) {
    return await cached;
  }

  const tPromise = inline(async () => {
    const t = getDefaultT();

    await loadLanguages([localeCode]);
    await changeLanguage(localeCode);
    await loadNamespaces(getSupportedNamespaces());

    return t;
  });
  globalCacheByLocaleCode[localeCode] = tPromise;

  return await tPromise;
});
