import { saltedId } from 'freedom-syncable-store-types';

import { EMAIL_APP_SALT_ID } from './salt-ids.ts';

// File system structure is like:
// /mail (folder)
//   /storage (bundle)
//     …mail… (JSON files)
//   /collections (bundle)
//     /inbox (CRDT bundle)

// TODO: move paths to common package

/** The root folder for mail data */
export const MAIL_FOLDER_ID = saltedId('folder', 'mail');

/** The bundle containing actual received, sent, draft, etc. email files */
export const MAIL_STORAGE_BUNDLE_ID = saltedId('bundle', 'storage');

/** The bundle containing mail collections (which are effectively views on the data in the mail folder) */
export const MAIL_COLLECTIONS_BUNDLE_ID = saltedId({ type: 'bundle', defaultSaltId: EMAIL_APP_SALT_ID }, 'collections');
