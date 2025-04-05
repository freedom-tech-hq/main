import type { TestContext } from 'node:test';
import { describe, it } from 'node:test';

import { ZERO_UUID } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { storageRootIdInfo, SyncablePath, timeId, uuidId } from 'freedom-sync-types';

import { ACCESS_CONTROL_BUNDLE_ID, SNAPSHOTS_BUNDLE_ID } from '../../../../consts/special-file-ids.ts';
import {
  isAccessControlDocumentPath,
  isAccessControlDocumentSnapshotFilePath,
  isSpecialAutomaticallyTrustedPath
} from '../special-path-checks.ts';

const accessControlBundlePath = new SyncablePath(storageRootIdInfo.make(makeUuid()), uuidId('folder', ZERO_UUID), ACCESS_CONTROL_BUNDLE_ID);

const accessControlDocumentSnapshotFilePath = accessControlBundlePath.append(SNAPSHOTS_BUNDLE_ID({ encrypted: false }), timeId('file'));

describe('special-path-checks', () => {
  it('access control document paths should be automatically trusted', (t: TestContext) => {
    t.assert.strictEqual(isSpecialAutomaticallyTrustedPath(accessControlBundlePath), true);
  });

  it('access control document paths should be detected', (t: TestContext) => {
    t.assert.strictEqual(isAccessControlDocumentPath(accessControlBundlePath), true);
  });

  it('access control document snapshot files should be detected', (t: TestContext) => {
    t.assert.strictEqual(isAccessControlDocumentSnapshotFilePath(accessControlDocumentSnapshotFilePath), true);
  });
});
