import type { LocalItemMetadata } from '../types/metadata/LocalItemMetadata.ts';

export const mergeLocalItemMetadata = <T extends Partial<LocalItemMetadata>>(dest: T, src: Partial<LocalItemMetadata>): T => {
  dest.hash = src.hash;
  dest.numDescendants = src.numDescendants;
  dest.sizeBytes = src.sizeBytes;

  return dest;
};
