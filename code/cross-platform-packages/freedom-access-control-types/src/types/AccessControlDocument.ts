import type { PR } from 'freedom-async';
import { AsyncTransient, inline, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { makeSerializedValueSchema, type SerializedValue } from 'freedom-basic-data';
import { ConflictError, NotFoundError } from 'freedom-common-errors';
import { ConflictFreeDocument } from 'freedom-conflict-free-document';
import type { EncodedConflictFreeDocumentDelta, EncodedConflictFreeDocumentSnapshot } from 'freedom-conflict-free-document-data';
import { type Trace } from 'freedom-contexts';
import type { CombinationCryptoKeySet, CryptoKeySetId, EncryptedValue, SignedValue } from 'freedom-crypto-data';
import { makeSignedValueSchema, publicKeysByIdSchema } from 'freedom-crypto-data';
import { deserialize } from 'freedom-serialization';
import type { Schema } from 'yaschema';

import type { AccessControlState } from './AccessControlState.ts';
import { makeAccessControlStateSchema } from './AccessControlState.ts';
import type { InitialAccess } from './InitialAccess.ts';
import type { SharedKeys } from './SharedKeys.ts';
import { sharedKeysSchema } from './SharedKeys.ts';
import type { SharedSecretKeys } from './SharedSecretKeys.ts';
import type { TimedAccessChange } from './TimedAccessChange.ts';
import { makeTimedAccessChangeSchema } from './TimedAccessChange.ts';

export const ACCESS_CONTROL_DOCUMENT_PREFIX = 'ACCESS-CONTROL';
export type AccessControlDocumentPrefix = typeof ACCESS_CONTROL_DOCUMENT_PREFIX;

export abstract class AccessControlDocument<RoleT extends string> extends ConflictFreeDocument<AccessControlDocumentPrefix> {
  private readonly stateSchema_: Schema<SignedValue<SerializedValue<AccessControlState<RoleT>>>>;
  private readonly publicKeysByIdSchema_: Schema<SignedValue<SerializedValue<Partial<Record<CryptoKeySetId, CombinationCryptoKeySet>>>>>;
  private readonly changeSchema_: Schema<SignedValue<SerializedValue<TimedAccessChange<RoleT>>>>;

  private readonly transients_ = new AsyncTransient(async (trace) => {
    const initialTransients = await this.getInitialTransients_(trace);
    if (!initialTransients.ok) {
      return initialTransients;
    }
    const { state, publicKeysById } = initialTransients.value;

    const transients = { state, publicKeysById };
    for (const change of this.changes_.values()) {
      const deserializedChange = await deserialize(trace, (await change).value);
      if (!deserializedChange.ok) {
        return deserializedChange;
      }

      applyChangeToTransients(transients, deserializedChange.value);
    }

    return makeSuccess(transients);
  });

  constructor({
    roleSchema,
    snapshot
  }: {
    roleSchema: Schema<RoleT>;
    snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<AccessControlDocumentPrefix> };
  }) {
    super(ACCESS_CONTROL_DOCUMENT_PREFIX, snapshot);

    this.stateSchema_ = makeSignedValueSchema(makeSerializedValueSchema(makeAccessControlStateSchema({ roleSchema })), undefined);
    this.publicKeysByIdSchema_ = makeSignedValueSchema(makeSerializedValueSchema(publicKeysByIdSchema), undefined);
    this.changeSchema_ = makeSignedValueSchema(makeSerializedValueSchema(makeTimedAccessChangeSchema({ roleSchema })), undefined);
  }

  public async initialize({ access }: { access: InitialAccess<RoleT> }) {
    await this.initialState_.set(access.state);
    await this.initialPublicKeysById_.set(access.publicKeysById);
    this.sharedKeys_.append(access.sharedKeys);
  }

  private cachedInitialAccess_: Promise<InitialAccess<RoleT>> | undefined;
  protected get initialAccess_(): Promise<InitialAccess<RoleT>> {
    if (this.cachedInitialAccess_ === undefined) {
      this.cachedInitialAccess_ = inline(
        async (): Promise<InitialAccess<RoleT>> => ({
          state: (await this.initialState_.get())!,
          publicKeysById: (await this.initialPublicKeysById_.get())!,
          sharedKeys: Array.from(this.sharedKeys_.values())
        })
      );
    }
    return this.cachedInitialAccess_;
  }

  // Overridden Public Methods

  public override applyDeltas(
    deltas: Array<EncodedConflictFreeDocumentDelta<AccessControlDocumentPrefix>>,
    options?: { updateDeltaBasis?: boolean }
  ): void {
    super.applyDeltas(deltas, options);

    this.transients_.markNeedsUpdate();
  }

  // Field Helpers

  public readonly getAccessControlState = makeAsyncResultFunc(
    [import.meta.filename, 'getAccessControlState'],
    async (trace): PR<Readonly<AccessControlState<RoleT>>> => {
      const transients = await this.transients_.getValue(trace);
      if (!transients.ok) {
        return transients;
      }

      return makeSuccess(transients.value.state);
    }
  );

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
      const initialTransients = await this.getInitialTransients_(trace);
      if (!initialTransients.ok) {
        return initialTransients;
      }
      const { state, publicKeysById } = initialTransients.value;

      const transients = { state, publicKeysById };
      for (const change of this.changes_.values()) {
        const deserializedChange = await deserialize(trace, (await change).value);
        if (!deserializedChange.ok) {
          return deserializedChange;
        }

        if (deserializedChange.value.timeMSec <= timeMSec) {
          applyChangeToTransients(transients, deserializedChange.value);
        }
      }

      const role = state[cryptoKeySetId];
      return makeSuccess(role !== undefined && oneOfRoles.has(role));
    }
  );

  public readonly getPublicKeysById = makeAsyncResultFunc(
    [import.meta.filename, 'getKeysById'],
    async (trace, publicKeyId: CryptoKeySetId): PR<CombinationCryptoKeySet, 'not-found'> => {
      const transients = await this.transients_.getValue(trace);
      if (!transients.ok) {
        return transients;
      }

      const publicKeysById_ = transients.value.publicKeysById;

      const found = publicKeysById_[publicKeyId];
      if (found === undefined) {
        return makeFailure(new NotFoundError(trace, { message: `No public keys found for ID: ${publicKeyId}`, errorCode: 'not-found' }));
      }

      return makeSuccess(found);
    }
  );

  public readonly addChange = makeAsyncResultFunc(
    [import.meta.filename, 'addChange'],
    async (trace: Trace, change: SignedValue<SerializedValue<TimedAccessChange<RoleT>>>): PR<undefined, 'conflict'> => {
      const deserializedChange = await deserialize(trace, change.value);
      if (!deserializedChange.ok) {
        return deserializedChange;
      }

      if (this.initialState_.get() === undefined) {
        return makeFailure(new ConflictError(trace, { message: "Initial state isn't set" }));
      }

      const transients = await this.transients_.getValue(trace);
      if (!transients.ok) {
        return transients;
      }

      // Directly modifying the transients
      if (!applyChangeToTransients(transients.value, deserializedChange.value)) {
        return makeFailure(new ConflictError(trace, { message: 'Change is invalid', errorCode: 'conflict' }));
      }

      // TODO: if an add and remove happen at about the same time, its likely that the new user might not get access to the new secret.  this should be mitigated during the merge of the remove, to make sure that it really includes all users and access control changes should be done synchronously
      switch (deserializedChange.value.type) {
        case 'add-access': {
          this.insertEncryptedSecretKeysForUser_(
            deserializedChange.value.publicKeys.id,
            deserializedChange.value.encryptedSecretKeysForNewUserBySharedKeysId
          );
          break;
        }

        case 'modify-access':
          if (deserializedChange.value.encryptedSecretKeysForModifiedUserBySharedKeysId !== undefined) {
            this.insertEncryptedSecretKeysForUser_(
              deserializedChange.value.publicKeyId,
              deserializedChange.value.encryptedSecretKeysForModifiedUserBySharedKeysId
            );
          }
          if (deserializedChange.value.newSharedKeys !== undefined) {
            this.sharedKeys_.append([deserializedChange.value.newSharedKeys]);
          }
          break;

        case 'remove-access':
          this.sharedKeys_.append([deserializedChange.value.newSharedKeys]);
          break;
      }

      this.changes_.append([change]);

      return makeSuccess(undefined);
    }
  );

  public readonly getSharedKeys = makeAsyncResultFunc(
    [import.meta.filename, 'getSharedKeys'],
    async (_trace: Trace): PR<SharedKeys[]> => makeSuccess(Array.from(this.sharedKeys_.values()))
  );

  // Protected Field Access Methods

  protected get initialState_() {
    return this.generic.getAsyncObjectField<SignedValue<SerializedValue<AccessControlState<RoleT>>>>('initialState', this.stateSchema_);
  }

  protected get initialPublicKeysById_() {
    return this.generic.getAsyncObjectField<SignedValue<SerializedValue<Partial<Record<CryptoKeySetId, CombinationCryptoKeySet>>>>>(
      'initialPublicKeysById',
      this.publicKeysByIdSchema_
    );
  }

  protected get changes_() {
    return this.generic.getAsyncArrayField<SignedValue<SerializedValue<TimedAccessChange<RoleT>>>>('changes', this.changeSchema_);
  }

  protected get sharedKeys_() {
    return this.generic.getArrayField<SharedKeys>('sharedKeys', sharedKeysSchema);
  }

  // Private Methods

  private getInitialTransients_ = makeAsyncResultFunc(
    [import.meta.filename, 'getInitialTransients_'],
    async (
      trace: Trace
    ): PR<{ state: AccessControlState<RoleT>; publicKeysById: Partial<Record<CryptoKeySetId, CombinationCryptoKeySet>> }> => {
      const serializedState = (await this.initialState_.get())!.value;
      const serializedPublicKeysById = (await this.initialPublicKeysById_.get())!.value;

      const deserializedState = await deserialize(trace, serializedState);
      if (!deserializedState.ok) {
        return deserializedState;
      }
      const state = deserializedState.value;

      const deserializedPublicKeysById = await deserialize(trace, serializedPublicKeysById);
      if (!deserializedPublicKeysById.ok) {
        return deserializedPublicKeysById;
      }
      const publicKeysById = deserializedPublicKeysById.value;

      return makeSuccess({ state, publicKeysById });
    }
  );

  private insertEncryptedSecretKeysForUser_(
    userPublicKeyId: CryptoKeySetId,
    encryptedSecretKeysForUserBySharedKeysId: Partial<Record<CryptoKeySetId, EncryptedValue<SharedSecretKeys>>>
  ) {
    for (const [index, sharedKeys] of this.sharedKeys_.entries()) {
      const encryptedSecretKeysForNewUser = encryptedSecretKeysForUserBySharedKeysId[sharedKeys.id];
      if (encryptedSecretKeysForNewUser !== undefined) {
        sharedKeys.secretKeysEncryptedPerMember[userPublicKeyId] = encryptedSecretKeysForNewUser;
        // Since this is part of the CRDT document, we need to actually update the data structure so it gets tracked
        this.sharedKeys_.splice(index, 1, [sharedKeys]);
      }
    }
  }
}

// Helpers

const applyChangeToTransients = <RoleT extends string>(
  { state, publicKeysById }: { state: AccessControlState<RoleT>; publicKeysById: Partial<Record<CryptoKeySetId, CombinationCryptoKeySet>> },
  change: TimedAccessChange<RoleT>
): boolean => {
  switch (change.type) {
    case 'add-access':
      if (state[change.publicKeys.id] === undefined) {
        state[change.publicKeys.id] = change.role;
        if (publicKeysById[change.publicKeys.id] === undefined) {
          publicKeysById[change.publicKeys.id] = change.publicKeys;
        }
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
