import { normalizeForLocalizationKey } from 'freedom-localization';
import { isEqual } from 'lodash-es';

import { parseLocalizeOptions } from '../parseLocalizeOptions.ts';
import { AppError } from '../types/AppError.ts';
import { parseString } from './parseString.ts';
import { parseTemplateString } from './parseTemplateString.ts';
import { parameterizedLocalizeRegex, templateParameterRegexCapturing, templateStringPartRegexGlobal } from './patterns.ts';
import type { LocalizationInfo } from './types/LocalizationInfo.ts';
import type { ParameterizedLocalizationInfo } from './types/ParameterizedLocalizationInfo.ts';

export const extractParameterizedLocalization = (
  localization: string,
  inOutLocalizationInfosByNamespaceAndKey: Record<string, Record<string, LocalizationInfo>>,
  out: { hadIssues: boolean },
  { defaultNs }: { defaultNs: string }
) => {
  const match = parameterizedLocalizeRegex.exec(localization);
  if (match === null) {
    throw new AppError(`Failed to match parameterized localization regex`);
  }

  const [_ignore, unparsedTemplateString, unparsedOptions] = match;
  const parsedOptions = parseLocalizeOptions(unparsedOptions);

  const namespace = parsedOptions.ns?.value ?? defaultNs;

  inOutLocalizationInfosByNamespaceAndKey[namespace] = inOutLocalizationInfosByNamespaceAndKey[namespace] ?? {};

  const lastPlainKeyPart: string[] = [];
  const defaultKeyParts: string[] = [];
  const defaultValueParts: string[] = [];
  const parameters = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = templateStringPartRegexGlobal.exec(unparsedTemplateString)) !== null) {
    if (m[0].charAt(0) === '$') {
      if (lastPlainKeyPart.length > 0) {
        const parsedString = parseTemplateString(`\`${lastPlainKeyPart.join('')}\``);
        defaultKeyParts.push(normalizeForLocalizationKey(parsedString));
        defaultValueParts.push(parsedString);
        lastPlainKeyPart.length = 0;
      }

      const m2 = templateParameterRegexCapturing.exec(m[0]);
      if (m2 !== null) {
        const unparsedParameterName = m2[1];
        const parameterName = parseString(unparsedParameterName);
        parameters.add(parameterName);
        defaultKeyParts.push(`_${normalizeForLocalizationKey(parameterName)}_`);
        defaultValueParts.push(`{{${parameterName}}}`);
      }
    } else {
      lastPlainKeyPart.push(m[0]);
    }
  }

  if (lastPlainKeyPart.length > 0) {
    const parsedString = parseTemplateString(`\`${lastPlainKeyPart.join('')}\``);
    defaultKeyParts.push(normalizeForLocalizationKey(parsedString));
    defaultValueParts.push(parsedString);
    lastPlainKeyPart.length = 0;
  }

  const key = parsedOptions.key?.value ?? defaultKeyParts.join('');
  const defaultValue = defaultValueParts.join('');

  const newValue: ParameterizedLocalizationInfo = { type: 'parameterized', key, parameters: Array.from(parameters), defaultValue };
  if (inOutLocalizationInfosByNamespaceAndKey[namespace][key] !== undefined) {
    if (!isEqual(inOutLocalizationInfosByNamespaceAndKey[namespace][key], newValue)) {
      console.warn(`${key} defined multiple times in ${namespace}`);
      out.hadIssues = true;
    }
  }

  inOutLocalizationInfosByNamespaceAndKey[namespace][key] = newValue;
};
