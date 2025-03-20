import { glob } from 'glob';
import { flatten } from 'lodash-es';

export const findFiles = async ({ includes, excludes }: { includes: string[]; excludes: string[] }) => {
  const resolvedDeclaredIncludes = flatten(await Promise.all(includes.map((pathGlob) => glob(pathGlob)) ?? []));
  const resolvedDeclaredExcludes = new Set(flatten(await Promise.all(excludes.map((pathGlob) => glob(pathGlob)) ?? [])));

  return resolvedDeclaredIncludes.filter((path) => !resolvedDeclaredExcludes.has(path));
};
