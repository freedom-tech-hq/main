export interface SyncableStoreLogEntryCheckExists {
  type: 'check-exists';
  pathString: string;
}

export interface SyncableStoreLogEntryCreateBinary {
  type: 'create-binary';
  pathString: string;
}

export interface SyncableStoreLogEntryCreateBundle {
  type: 'create-bundle';
  pathString: string;
}

export interface SyncableStoreLogEntryCreateFolder {
  type: 'create-folder';
  pathString: string;
}

export interface SyncableStoreLogEntryDecodeData {
  type: 'decode-data';
  pathString: string;
}

export interface SyncableStoreLogEntryDelete {
  type: 'delete';
  pathString: string;
}

export interface SyncableStoreLogEntryEncodeData {
  type: 'encode-data';
  pathString: string;
}

export interface SyncableStoreLogEntryGetData {
  type: 'get-data';
  pathString: string;
}

export interface SyncableStoreLogEntryGetIds {
  type: 'get-ids';
  pathString: string;
}

export interface SyncableStoreLogEntryGetMetadata {
  type: 'get-metadata';
  pathString: string;
}

export interface SyncableStoreLogEntryGetMetadataById {
  type: 'get-metadata-by-id';
  pathString: string;
}

export type SyncableStoreLogEntry =
  | SyncableStoreLogEntryCheckExists
  | SyncableStoreLogEntryCreateBinary
  | SyncableStoreLogEntryCreateBundle
  | SyncableStoreLogEntryCreateFolder
  | SyncableStoreLogEntryDecodeData
  | SyncableStoreLogEntryDelete
  | SyncableStoreLogEntryEncodeData
  | SyncableStoreLogEntryGetData
  | SyncableStoreLogEntryGetIds
  | SyncableStoreLogEntryGetMetadata
  | SyncableStoreLogEntryGetMetadataById;
