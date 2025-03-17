import { makeIdInfo } from 'freedom-basic-data';

export const storageRootIdInfo = makeIdInfo('STORAGE_');
export type StorageRootId = typeof storageRootIdInfo.schema.valueType;
