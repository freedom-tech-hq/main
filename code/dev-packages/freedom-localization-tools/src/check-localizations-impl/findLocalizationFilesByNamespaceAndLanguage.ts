import fs from 'node:fs/promises';

import { glob } from 'glob';
import { isEqual } from 'lodash-es';
import type { JsonObject } from 'yaschema';

import { AppError } from '../types/AppError.ts';
import type { MainArgs } from './MainArgs.ts';

const filenameRegex = /\/([^/.]+)\.json$/;

export const findLocalizationFilesByNamespaceAndLanguage = async ({ in: dir, out }: MainArgs & { out: { hadIssues: boolean } }) => {
  try {
    const localizationFilesByNamespaceAndLanguage: Record<string, Record<string, { path: string; content: JsonObject }>> = {};

    const paths = await glob([`${dir}/**/localization/*.json`]);
    await Promise.all(
      paths.map(async (path): Promise<void> => {
        const filenameMatch = filenameRegex.exec(path);
        if (filenameMatch === null) {
          return;
        }

        const [_ignore, languageCode] = filenameMatch;

        const jsonString = await fs.readFile(path, 'utf-8');
        const json = JSON.parse(jsonString) as JsonObject;
        if (json === null || typeof json !== 'object') {
          throw new AppError(`Expected JSON object at root of ${path}`);
        }

        const keys = Object.keys(json);
        if (keys.length !== 1) {
          throw new AppError(`Expected exactly one namespace in ${path}`);
        }
        const namespace = keys[0];

        localizationFilesByNamespaceAndLanguage[namespace] = localizationFilesByNamespaceAndLanguage[namespace] ?? {};

        const content = json[namespace];
        if (typeof content !== 'object') {
          throw new AppError(`Expected JSON object inside namespace of ${path}`);
        }

        const newValue = { path, content: content as JsonObject };
        if (localizationFilesByNamespaceAndLanguage[namespace][languageCode] !== undefined) {
          if (!isEqual(localizationFilesByNamespaceAndLanguage[namespace][languageCode], newValue)) {
            console.warn(`${namespace} defined multiple times for ${languageCode}`);
            out.hadIssues = true;
          }
        }

        localizationFilesByNamespaceAndLanguage[namespace][languageCode] = newValue;
      })
    );

    return localizationFilesByNamespaceAndLanguage;
  } catch (e) {
    if (e instanceof AppError) {
      console.error(e.message);
      process.exit(1);
    } else {
      throw e;
    }
  }
};
