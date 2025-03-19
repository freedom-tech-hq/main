import { normalizeForLocalizationKey } from 'freedom-localization';
import { isEqual } from 'lodash-es';

import { parseLocalizeOptions } from '../parseLocalizeOptions.ts';
import { AppError } from '../types/AppError.ts';
import { parseString } from './parseString.ts';
import { simpleLocalizeRegex } from './patterns.ts';
import type { LocalizationInfo } from './types/LocalizationInfo.ts';
import type { SimpleLocalizationInfo } from './types/SimpleLocalizationInfo.ts';

// Helpers
export const extractSimpleLocalization = (
  localization: string,
  inOutLocalizationInfosByNamespaceAndKey: Record<string, Record<string, LocalizationInfo>>,
  out: { hadIssues: boolean },
  { defaultNs }: { defaultNs: string }
) => {
  const match = simpleLocalizeRegex.exec(localization);
  if (match === null) {
    throw new AppError(`Failed to match simple localization regex`);
  }

  const [_ignore, unparsedDefaultValue, unparsedOptions] = match;
  const parsedOptions = parseLocalizeOptions(unparsedOptions);

  const defaultValue = parseString(unparsedDefaultValue);
  const namespace = parsedOptions.ns?.value ?? defaultNs;

  inOutLocalizationInfosByNamespaceAndKey[namespace] = inOutLocalizationInfosByNamespaceAndKey[namespace] ?? {};

  const key = parsedOptions.key !== undefined ? parsedOptions.key.value : normalizeForLocalizationKey(defaultValue);

  const newValue: SimpleLocalizationInfo = { type: 'simple', key, defaultValue };
  if (inOutLocalizationInfosByNamespaceAndKey[namespace][key] !== undefined) {
    if (!isEqual(inOutLocalizationInfosByNamespaceAndKey[namespace][key], newValue)) {
      console.warn(`${key} defined multiple times in ${namespace}`);
      out.hadIssues = true;
    }
  }

  inOutLocalizationInfosByNamespaceAndKey[namespace][key] = newValue;
};
