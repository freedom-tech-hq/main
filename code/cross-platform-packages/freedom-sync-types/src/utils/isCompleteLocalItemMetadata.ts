import type { LocalItemMetadata } from '../types/metadata/LocalItemMetadata.ts';

export const isCompleteLocalItemMetadata = (localItemMetadata: Partial<LocalItemMetadata>): localItemMetadata is LocalItemMetadata =>
  localItemMetadata.hash !== undefined && localItemMetadata.numDescendants !== undefined && localItemMetadata.sizeBytes !== undefined;
