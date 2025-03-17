import fs from 'node:fs/promises';

import { glob } from 'glob';
import { flatten } from 'lodash-es';

export const findTsFiles = async ({ includes, excludes }: { includes: string[]; excludes: string[] }) => {
  const resolvedDeclaredIncludes = flatten(await Promise.all(includes.map((pathGlob) => glob(pathGlob)) ?? []));
  const resolvedDeclaredExcludes = flatten(await Promise.all(excludes.map((pathGlob) => glob(pathGlob)) ?? []));

  const resolvedIncludesWithImplicitFolderExpansion = flatten(
    await Promise.all(
      resolvedDeclaredIncludes.map(async (path) => {
        const stat = await fs.lstat(path);
        if (!stat.isDirectory()) {
          return [path];
        }

        return glob(`${path}/**/*.ts?(x)`);
      })
    )
  );
  const resolvedExcludesWithImplicitFolderExpansion = new Set(
    flatten(
      await Promise.all(
        resolvedDeclaredExcludes.map(async (path) => {
          const stat = await fs.lstat(path);
          if (!stat.isDirectory()) {
            return [path];
          }

          return glob(`${path}/**/*.ts?(x)`);
        })
      )
    )
  );

  return resolvedIncludesWithImplicitFolderExpansion.filter((path) => !resolvedExcludesWithImplicitFolderExpansion.has(path));
};
