import type { PackageContext, PropertyPath } from '../types/types.ts';
import { formatPath } from './utils.ts';

let hasProblems = false;

export function inform(isFixable: boolean, { package: pkg, isDryRun }: PackageContext, path: PropertyPath, message: string): void {
  if (!isFixable) {
    console.error(`[${pkg}] [${formatPath(path)}] ${message}`);
    hasProblems = true;
    return;
  }

  console.warn(`[${pkg}] ${isDryRun ? 'fixable' : 'FIXED'} [${formatPath(path)}] ${message}`);
  if (isDryRun) {
    hasProblems = true;
  }
}

export function getHasProblems(): boolean {
  return hasProblems;
}

export function markHasProblems(): void {
  hasProblems = true;
}
