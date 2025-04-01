import { saltedId } from 'freedom-syncable-store-types';

// File system structure is like:
// /mail (folder)
//   /storage (bundle)
//     …mail… (JSON files)
//   /collections (bundle)
//     /inbox (CRDT bundle)

/** The root folder for mail data */
export const MAIL_FOLDER_ID = saltedId('folder', 'mail');

/** The bundle containing actual received, sent, draft, etc. email files */
export const MAIL_STORAGE_BUNDLE_ID = saltedId('bundle', 'storage');

/** The bundle containing mail collections (which are effectively views on the data in the mail folder) */
export const MAIL_COLLECTIONS_BUNDLE_ID = saltedId('bundle', 'collections');
