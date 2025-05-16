import fs from 'node:fs/promises';
import path from 'node:path';

import * as glob from 'glob';

import type { FoundPackage } from '../types/types.ts';

const CODE_DIR = path.resolve(import.meta.dirname, '../../../../..');

export async function findPackages(): Promise<FoundPackage[]> {
  // Read the root package.json to get workspace patterns
  const rootPackageJsonPath = path.join(CODE_DIR, 'package.json');
  const rootPackageContent = await fs.readFile(rootPackageJsonPath, 'utf8');
  const rootPackage = JSON.parse(rootPackageContent) as { workspaces?: { packages?: string[] } };

  // Extract workspaces.packages patterns
  const workspacePatterns = rootPackage.workspaces?.packages ?? [];
  if (workspacePatterns.length === 0) {
    throw new Error('No workspace patterns found in root package.json');
  }

  const packages: FoundPackage[] = [];

  // Process each workspace pattern
  for (const pattern of workspacePatterns) {
    // Convert the glob pattern to absolute path
    const absolutePattern = path.join(CODE_DIR, pattern);

    // Find all matching directories
    const matches = glob.sync(absolutePattern, { cwd: CODE_DIR });

    for (const absolutePath of matches) {
      const relativePath = path.relative(CODE_DIR, absolutePath);
      const pathParts = relativePath.split(path.sep);

      // The pattern is assumed to be in the format "group/*", so the first part is the group
      // and the second part is the package name
      if (pathParts.length !== 2) {
        throw new Error(`Unexpected workspace pattern: ${pattern}`);
      }
      const [group, packageName] = pathParts as [string, string];
      packages.push({
        group,
        package: relativePath,
        packageName,
        packagePath: path.join(absolutePath, 'package.json')
      });
    }
  }

  return packages;
}
