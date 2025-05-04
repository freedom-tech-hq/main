import * as fs from 'node:fs/promises';

import { packageTemplate } from './template.ts';
import type { EffectiveValueObject } from './types/types.ts';
import { findPackages } from './utils/findPackages.ts';
import { getHasProblems, markHasProblems } from './utils/inform.ts';
import { validateObjectEntry } from './utils/validateEntry.ts';

async function main(): Promise<void> {
  // Process args
  const isDryRun = !process.argv.includes('--fix');

  // Scan
  const packages = await findPackages();

  // Process each
  for (const { group, package: pkg, packageName, packagePath } of packages) {
    try {
      const rawContent = await fs.readFile(packagePath, 'utf8');
      const content = JSON.parse(rawContent) as EffectiveValueObject;

      // Validate and reorder
      const validated = validateObjectEntry(packageTemplate, content, {
        // Context
        group,
        package: pkg,
        packageName,
        isDryRun
      });

      // Report
      const newContent = JSON.stringify(validated, null, 2);
      if (newContent !== rawContent.trim()) {
        if (isDryRun) {
          console.warn(`[${pkg}] package.json has auto-fixes`);
          markHasProblems();
        } else {
          await fs.writeFile(packagePath, newContent + '\n');
          console.log(`[${pkg}] package.json updated`);
        }
      }
    } catch (e: unknown) {
      const error = e as { code?: string; message: string };
      if (error.code === 'ENOENT') {
        console.error(`[${pkg}] No package.json found`);
      } else {
        markHasProblems();
        console.error(`[${pkg}] Error:`, error.message);
      }
    }
  }

  // Final report
  if (getHasProblems()) {
    process.exit(2);
  } else {
    console.log('OK');
  }
}

main().catch((error) => {
  console.error('Failed to process packages:', error);
  process.exit(1);
});
