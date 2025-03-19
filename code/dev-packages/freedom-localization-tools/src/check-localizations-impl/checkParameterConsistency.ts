import type { JsonObject } from 'yaschema';

import type { LocalizationInfo } from './types/LocalizationInfo.ts';

const paramRegex = /\{\{([^}]+)\}\}/;
const paramRegexGlobal = new RegExp(paramRegex.source, 'g');

export const checkParameterConsistency = ({
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
    const localizationInfo = localizationInfosByKey[key];
    if (localizationInfo === undefined || content[key] === undefined) {
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const stringValue = String(content[key] ?? '');

    switch (localizationInfo.type) {
      case 'simple':
        if (paramRegex.test(stringValue)) {
          console.warn(`Parameters are used for ${key} in ${path}, but they're not used in code`);
          out.hadIssues = true;
        }
        break;
      case 'parameterized': {
        const usedParams = new Set<string>();
        let match: RegExpExecArray | null;
        while ((match = paramRegexGlobal.exec(stringValue)) !== null) {
          usedParams.add(match[1]);
        }

        for (const param of localizationInfo.parameters) {
          if (!usedParams.has(param)) {
            console.warn(`Parameter ${param} is unused for ${key} in ${path}, but specified in the code`);
            out.hadIssues = true;
          }
        }

        const localizationInfoParameters = new Set(localizationInfo.parameters);
        for (const param of usedParams) {
          if (!localizationInfoParameters.has(param)) {
            console.warn(`Unknown parameter ${param} found for ${key} in ${path}`);
            out.hadIssues = true;
          }
        }

        break;
      }
    }
  }
};
