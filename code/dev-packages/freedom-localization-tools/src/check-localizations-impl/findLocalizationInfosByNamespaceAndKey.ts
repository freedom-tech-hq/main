import fs from 'node:fs/promises';

import { glob } from 'glob';

import { AppError } from '../types/AppError.ts';
import { extractParameterizedLocalization } from './extractParameterizedLocalization.ts';
import { extractSimpleLocalization } from './extractSimpleLocalization.ts';
import type { MainArgs } from './MainArgs.ts';
import { parseString } from './parseString.ts';
import { nsDefinitionRegex, parameterizedLocalizeRegexGlobal, simpleLocalizeRegexGlobal } from './patterns.ts';
import type { LocalizationInfo } from './types/LocalizationInfo.ts';

export const findLocalizationInfosByNamespaceAndKey = async ({ in: dir, out }: MainArgs & { out: { hadIssues: boolean } }) => {
  try {
    const localizationInfosByNamespaceAndKey: Record<string, Record<string, LocalizationInfo>> = {};

    const paths = await glob([`${dir}/**/*.ts`, `${dir}/**/*.tsx`]);
    await Promise.all(
      paths.map(async (path): Promise<void> => {
        const code = await fs.readFile(path, 'utf-8');

        let defaultNs = 'default';
        const nsDefinitionMatch = nsDefinitionRegex.exec(code);
        if (nsDefinitionMatch !== null) {
          defaultNs = parseString(nsDefinitionMatch[1]);
        }

        let match: RegExpExecArray | null;
        while ((match = simpleLocalizeRegexGlobal.exec(code)) !== null) {
          extractSimpleLocalization(match[0], localizationInfosByNamespaceAndKey, out, { defaultNs });
        }
        while ((match = parameterizedLocalizeRegexGlobal.exec(code)) !== null) {
          extractParameterizedLocalization(match[0], localizationInfosByNamespaceAndKey, out, { defaultNs });
        }
      })
    );

    return localizationInfosByNamespaceAndKey;
  } catch (e) {
    if (e instanceof AppError) {
      console.error(e.message);
      process.exit(1);
    } else {
      throw e;
    }
  }
};
