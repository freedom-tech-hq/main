import { checkForExtraneousKeys } from './checkForExtraneousKeys.ts';
import { checkForMissingKeys } from './checkForMissingKeys.ts';
import { checkParameterConsistency } from './checkParameterConsistency.ts';
import { findLocalizationFilesByNamespaceAndLanguage } from './findLocalizationFilesByNamespaceAndLanguage.ts';
import { findLocalizationInfosByNamespaceAndKey } from './findLocalizationInfosByNamespaceAndKey.ts';
import type { MainArgs } from './MainArgs.ts';

export const checkLocalizationConsistency = async ({ in: dir }: MainArgs) => {
  const out: { hadIssues: boolean } = { hadIssues: false };

  const [localizationInfosByNamespaceAndKey, localizationFilesByNamespaceAndLanguage] = await Promise.all([
    findLocalizationInfosByNamespaceAndKey({ in: dir, out }),
    findLocalizationFilesByNamespaceAndLanguage({ in: dir, out })
  ]);
  const codeNamespaces = new Set(Object.keys(localizationInfosByNamespaceAndKey));
  const localizationFileNamespaces = new Set(Object.keys(localizationFilesByNamespaceAndLanguage));
  const namespaces = new Set([...codeNamespaces, ...localizationFileNamespaces]);

  try {
    await Promise.all(
      Array.from(namespaces).map(async (namespace): Promise<void> => {
        if (localizationFileNamespaces.has(namespace) && !codeNamespaces.has(namespace)) {
          console.warn(`Namespace ${namespace} is defined in localization files but not used by any code`);
          out.hadIssues = true;
          return;
        }

        if (codeNamespaces.has(namespace) && !localizationFileNamespaces.has(namespace)) {
          // This shouldn't cause the program to return a non-0 exit status
          console.info(`No localizations were provided for namespace ${namespace}`);
          return;
        }

        const languages = Object.keys(localizationFilesByNamespaceAndLanguage[namespace] ?? {});
        await Promise.all(
          languages.map(async (language): Promise<void> => {
            const { path, content } = localizationFilesByNamespaceAndLanguage[namespace][language];
            const localizationInfosByKey = localizationInfosByNamespaceAndKey[namespace];
            checkForMissingKeys({ namespace, language, path, content, localizationInfosByKey, out });
            checkForExtraneousKeys({ namespace, language, path, content, localizationInfosByKey, out });
            checkParameterConsistency({ namespace, language, path, content, localizationInfosByKey, out });
          })
        );
      })
    );
  } finally {
    if (out.hadIssues) {
      process.exit(1);
    }
  }
};
