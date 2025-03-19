import type { JsonObject } from 'yaschema';

import type { LocalizationInfo } from './types/LocalizationInfo.ts';

export const checkForMissingKeys = ({
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
  const keys = Object.keys(localizationInfosByKey);

  for (const key of keys) {
    if (typeof content[key] !== 'string') {
      const defaultValue = localizationInfosByKey[key]?.defaultValue;
      console.warn(
        `Missing value for ${key} in ${path}.${defaultValue !== undefined ? `  Default value: ${JSON.stringify(defaultValue)}` : ''}`
      );
      out.hadIssues = true;
    }
  }
};
