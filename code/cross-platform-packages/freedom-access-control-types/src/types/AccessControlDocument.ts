import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { ConflictError } from 'freedom-common-errors';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import type { Trace } from 'freedom-contexts';
import type { CryptoKeySetId, SignedValue } from 'freedom-crypto-data';
import { extractPartsFromTrustedTimeId, makeSignedValueSchema } from 'freedom-crypto-data';
import type { Schema } from 'yaschema';

import type { AccessControlState } from './AccessControlState.ts';
import { makeAccessControlStateSchema } from './AccessControlState.ts';
import type { InitialAccess } from './InitialAccess.ts';
import type { SharedSecret } from './SharedSecret.ts';
import { sharedSecretSchema } from './SharedSecret.ts';
import type { TimedAccessChange } from './TimedAccessChange.ts';
import { makeTimedAccessChangeSchema } from './TimedAccessChange.ts';

export const ACCESS_CONTROL_DOCUMENT_PREFIX = 'ACCESS-CONTROL';
export type AccessControlDocumentPrefix = typeof ACCESS_CONTROL_DOCUMENT_PREFIX;

export abstract class AccessControlDocument<RoleT extends string> extends ConflictFreeDocument<AccessControlDocumentPrefix> {
  private readonly stateSchema_: Schema<SignedValue<AccessControlState<RoleT>>>;
  private readonly changeSchema_: Schema<SignedValue<TimedAccessChange<RoleT>>>;

  private state_: AccessControlState<RoleT> = {};

  constructor({
    roleSchema,
    initialAccess,
    snapshot
  }: { roleSchema: Schema<RoleT> } & (
    | { initialAccess: InitialAccess<RoleT>; snapshot?: undefined }
    | { initialAccess?: undefined; snapshot: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<AccessControlDocumentPrefix> } }
  )) {
    super(ACCESS_CONTROL_DOCUMENT_PREFIX, snapshot);

    this.stateSchema_ = makeSignedValueSchema(makeAccessControlStateSchema({ roleSchema }), undefined);
    this.changeSchema_ = makeSignedValueSchema(makeTimedAccessChangeSchema({ roleSchema }), undefined);

    if (snapshot === undefined) {
      this.initialState_.set(initialAccess.state);
      this.sharedSecrets_.append(initialAccess.sharedSecrets);
    }

    this.state_ = this.rebuildState_();
  }

  protected get initialAccess_(): InitialAccess<RoleT> {
    return { state: this.initialState_.get()!, sharedSecrets: Array.from(this.sharedSecrets_.values()) };
  }

  // Overridden Public Methods

  public override applyDeltas(
    deltas: Array<EncodedConflictFreeDocumentDelta<AccessControlDocumentPrefix>>,
    options?: { updateDeltaBasis?: boolean }
  ): void {
    super.applyDeltas(deltas, options);

    this.state_ = this.rebuildState_();
  }

  // Field Helpers

  public get accessControlState(): AccessControlState<RoleT> {
    return { ...this.state_ };
  }

  // TODO: this is inefficient
  public readonly didHaveRoleAtTimeMSec = makeAsyncResultFunc(
    [import.meta.filename, 'didHaveRoleAtTimeMSec'],
    async (
      trace,
      {
        cryptoKeySetId,
        oneOfRoles,
        timeMSec
      }: {
        cryptoKeySetId: CryptoKeySetId;
        oneOfRoles: Set<RoleT>;
        timeMSec: number;
      }
    ): PR<boolean> => {
      const state = this.initialState_.get()!.value;

      for (const change of this.changes_.values()) {
        const trustedTimeIdParts = await extractPartsFromTrustedTimeId(trace, change.value.trustedTimeId);
        if (!trustedTimeIdParts.ok) {
          continue; // Skipping invalid time
        }
        if (trustedTimeIdParts.value.timeMSec <= timeMSec) {
          applyChangeToState(state, change.value);
        }
      }

      const role = state[cryptoKeySetId];
      return makeSuccess(role !== undefined && oneOfRoles.has(role));
    }
  );

  public readonly addChange = makeAsyncResultFunc(
    [import.meta.filename, 'addChange'],
    async (trace: Trace, change: SignedValue<TimedAccessChange<RoleT>>): PR<undefined, 'conflict'> => {
      if (this.initialState_.get() === undefined) {
        return makeFailure(new ConflictError(trace, { message: "Initial state isn't set" }));
      }

      if (!applyChangeToState(this.state_, change.value)) {
        return makeFailure(new ConflictError(trace, { message: 'Change is invalid', errorCode: 'conflict' }));
      }

      // TODO: if an add and remove happen at about the same time, its likely that the new user might not get access to the new secret.  this should be mitigated during the merge of the remove, to make sure that it really includes all users and access control changes should be done synchronously
      switch (change.value.type) {
        case 'add-access':
          for (const [index, sharedSecret] of this.sharedSecrets_.entries()) {
            const encryptedSecretKeysForNewUser = change.value.encryptedSecretKeysForNewUserBySharedSecretId[sharedSecret.id];
            if (encryptedSecretKeysForNewUser !== undefined) {
              sharedSecret.secretKeysEncryptedPerMember[change.value.publicKeyId] = encryptedSecretKeysForNewUser;
              this.sharedSecrets_.splice(index, 1, [sharedSecret]);
            }
          }
          break;

        case 'modify-access':
          break;

        case 'remove-access':
          this.sharedSecrets_.append([change.value.newSharedSecret]);
          break;
      }

      this.changes_.append([change]);

      return makeSuccess(undefined);
    }
  );

  public readonly getSharedSecrets = makeAsyncResultFunc(
    [import.meta.filename, 'getSharedSecrets'],
    async (_trace: Trace): PR<SharedSecret[]> => makeSuccess(Array.from(this.sharedSecrets_.values()))
  );

  // Protected Field Access Methods

  protected get initialState_() {
    return this.generic.getObjectField<SignedValue<AccessControlState<RoleT>>>('initialState', this.stateSchema_);
  }

  protected get changes_() {
    return this.generic.getArrayField<SignedValue<TimedAccessChange<RoleT>>>('changes', this.changeSchema_);
  }

  protected get sharedSecrets_() {
    return this.generic.getArrayField<SharedSecret>('sharedSecrets', sharedSecretSchema);
  }

  // Private Methods

  private readonly rebuildState_ = () => {
    const newState = this.initialState_.get()!.value;

    for (const change of this.changes_.values()) {
      applyChangeToState(newState, change.value);
    }

    return newState;
  };
}

// Helpers

const applyChangeToState = <RoleT extends string>(state: AccessControlState<RoleT>, change: TimedAccessChange<RoleT>): boolean => {
  switch (change.type) {
    case 'add-access':
      if (state[change.publicKeyId] === undefined) {
        state[change.publicKeyId] = change.role;
        return true;
      }
      break;

    case 'modify-access':
      if (state[change.publicKeyId] === change.oldRole) {
        state[change.publicKeyId] = change.newRole;
        return true;
      }
      break;

    case 'remove-access':
      if (state[change.publicKeyId] === change.oldRole) {
        delete state[change.publicKeyId];
        return true;
      }
      break;
  }

  return false;
};
