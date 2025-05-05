/* node:coverage disable */

import type { AccessControlDocumentPrefix } from 'freedom-access-control-types';
import { AccessControlDocument } from 'freedom-access-control-types';
import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { makeStringSubtypeArray, schema } from 'yaschema';

export const testStoreRoles = makeStringSubtypeArray('creator', 'editor', 'viewer', 'appender');
export type TestRole = (typeof testStoreRoles)[0];
export const testStoreRoleSchema = schema.string(...testStoreRoles);

export class TestAccessControlDocument extends AccessControlDocument<TestRole> {
  constructor(fwd?: { snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<AccessControlDocumentPrefix> } }) {
    super({ roleSchema: testStoreRoleSchema, ...fwd });
  }

  // Overridden Public Methods

  public override async clone(out?: TestAccessControlDocument): Promise<TestAccessControlDocument> {
    if (out === undefined) {
      return (await super.clone(out)) as TestAccessControlDocument;
    } else {
      const doc = new TestAccessControlDocument();
      await doc.initialize({ access: await this.initialAccess_ });
      return (await super.clone(doc)) as TestAccessControlDocument;
    }
  }

  // Public Methods

  public readonly isDeltaValidForRole = makeAsyncResultFunc(
    [import.meta.filename, 'isDeltaValidForRole'],
    async (
      _trace,
      { role }: { role: TestRole; encodedDelta: EncodedConflictFreeDocumentDelta<AccessControlDocumentPrefix> }
    ): PR<boolean> => {
      switch (role) {
        case 'creator':
          // Creators can do anything
          return makeSuccess(true);
        case 'editor':
        case 'viewer':
        case 'appender':
          // Editors and viewers are never allowed to make access control changes
          return makeSuccess(false);
      }
    }
  );
}
