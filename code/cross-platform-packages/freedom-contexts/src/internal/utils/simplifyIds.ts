/* node:coverage disable */

import { escapeRegExp, once } from 'lodash-es';

export const simplifyIds = (ids: string[]): string[] => {
  const regex = leadingCwdWithOptSrcAndFileExtensionRegex();
  if (regex === undefined) {
    return ids;
  }

  return ids.map((id) => id.replace(regex, ''));
};

// Helpers

// This is a simplified version of the `dirname` function from Node.js's `path` module.  This only supports Unix-style paths.
const dirname = (path: string): string => {
  if (path === '') {
    return '.';
  }

  // Remove trailing slashes, but keep root "/" intact
  path = path.replace(/\/+$/, '');
  if (path === '') {
    return '/';
  }

  // Find the last slash
  const lastSlashIndex = path.lastIndexOf('/');

  // If no slash found, return "."
  if (lastSlashIndex === -1) {
    return '.';
  }

  // If the last slash is at the start, return root "/"
  if (lastSlashIndex === 0) {
    return '/';
  }

  return path.slice(0, lastSlashIndex);
};

const leadingCwdWithOptSrcAndFileExtensionRegex = once(() => {
  try {
    const cwd = process.cwd();
    return new RegExp(`^${escapeRegExp(dirname(cwd))}/?|/src|\\.(?:[jt]sx?|[cm]js)$`, 'g');
  } catch (_e) {
    return undefined;
  }
});
