import type { JsonObject } from 'yaschema';

import type { LocalizationInfo } from './types/LocalizationInfo.ts';

export const checkForExtraneousKeys = ({
  path,
  content,
  localizationInfosByKey,
  out
}: {
  namespace: string;
  language: string;
  path: string;
  content: JsonObject;
  localizationInfosByKey: Partial<Record<string, LocalizationInfo>>;
  out: { hadIssues: boolean };
}) => {
  const keys = Object.keys(content);
  const localizationInfoKeys = new Set(Object.keys(localizationInfosByKey));
  for (const key of keys) {
    if (!localizationInfoKeys.has(key)) {
      console.warn(`Extraneous key ${key} found in ${path}`);
      out.hadIssues = true;
    }
  }
};
