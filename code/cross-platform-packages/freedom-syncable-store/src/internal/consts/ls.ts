import type { LsFormatter } from 'freedom-syncable-store-types';

export const defaultLsFormatter: LsFormatter = ({ itemId, metadata, dynamicName }) =>
  `${itemId}${dynamicName !== undefined ? ` (${JSON.stringify(dynamicName)})` : ''}: ${metadata.hash}`;
