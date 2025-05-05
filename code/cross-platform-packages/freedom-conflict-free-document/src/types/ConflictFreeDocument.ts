import type {
  EncodedConflictFreeDocumentDelta,
  EncodedConflictFreeDocumentDeltaInfo,
  EncodedConflictFreeDocumentSnapshot,
  EncodedConflictFreeDocumentSnapshotInfo
} from 'freedom-conflict-free-document-data';
import { makeEncodedConflictFreeDocumentDeltaInfo, makeEncodedConflictFreeDocumentSnapshotInfo } from 'freedom-conflict-free-document-data';
import type { Notifiable } from 'freedom-notification-types';
import { NotificationManager } from 'freedom-notification-types';
import { escapeRegExp } from 'lodash-es';
import { schema } from 'yaschema';
import * as Y from 'yjs';

import { fieldInfosFieldName } from '../internal/consts/fields.ts';
import type { ConflictFreeDocumentFieldTypeName } from '../internal/types/ConflictFreeDocumentFieldTypeName.ts';
import { conflictFreeDocumentFieldTypeNames } from '../internal/types/ConflictFreeDocumentFieldTypeName.ts';
import { cloneYDoc } from '../internal/utils/cloneYDoc.ts';
import { makeConflictFreeDocumentFieldInfos } from '../internal/utils/makeConflictFreeDocumentFieldInfos.ts';
import { makeFlattenedYDoc } from '../internal/utils/makeFlattenedYDoc.ts';
import { GenericConflictFreeDocumentFieldAccessor } from './GenericConflictFreeDocumentFieldAccessor.ts';

export type ConflictFreeDocumentNotifications<PrefixT extends string> = {
  change: { doc: ConflictFreeDocument<PrefixT> };
};

export class ConflictFreeDocument<PrefixT extends string> implements Notifiable<ConflictFreeDocumentNotifications<PrefixT>> {
  public readonly prefix: PrefixT;

  public get snapshotId() {
    return this.#snapshotId_;
  }

  #yDoc: Y.Doc;
  #deltaBasisYDoc: Y.Doc;
  #fieldInfos = makeConflictFreeDocumentFieldInfos();
  #snapshotId_: string | undefined;

  readonly #encodedConflictFreeDocumentSnapshotInfo: EncodedConflictFreeDocumentSnapshotInfo<PrefixT>;
  readonly #encodedConflictFreeDocumentDeltaInfo: EncodedConflictFreeDocumentDeltaInfo<PrefixT>;

  readonly #triggerChangeListeners = () => this.#notificationManager.notify('change', { doc: this });
  readonly #notificationManager = new NotificationManager<ConflictFreeDocumentNotifications<PrefixT>>({
    hookType: (type) => {
      switch (type) {
        case 'change':
          this.#yDoc.on('update', this.#triggerChangeListeners);
          break;
      }
    },
    unhookType: (type) => {
      switch (type) {
        case 'change':
          this.#yDoc.off('update', this.#triggerChangeListeners);
          break;
      }
    }
  });

  constructor(prefix: PrefixT, snapshot?: { id: string; encoded: EncodedConflictFreeDocumentSnapshot<PrefixT> }) {
    this.prefix = prefix;
    this.#yDoc = new Y.Doc();

    this.#encodedConflictFreeDocumentSnapshotInfo = makeEncodedConflictFreeDocumentSnapshotInfo(this.prefix);
    this.#encodedConflictFreeDocumentDeltaInfo = makeEncodedConflictFreeDocumentDeltaInfo(this.prefix);

    if (snapshot !== undefined) {
      const encodedBuffer = this.#encodedConflictFreeDocumentSnapshotInfo.toBuffer(snapshot.encoded);
      Y.applyUpdateV2(this.#yDoc, encodedBuffer);
      this.#snapshotId_ = snapshot.id;
    }

    this.#loadFieldInfos();

    this.#deltaBasisYDoc = cloneYDoc(this.#yDoc);
  }

  public addListener<TypeT extends keyof ConflictFreeDocumentNotifications<PrefixT>>(
    type: TypeT,
    callback: (args: ConflictFreeDocumentNotifications<PrefixT>[TypeT]) => void
  ): () => void {
    return this.#notificationManager.addListener(type, callback);
  }

  /** If no output document is specified, the cloned document will have the same id as this document.  One may call like
   * `clone(new ConflictFreeDocument('new-id'))` to clone but with a new document ID. */
  public async clone(out?: ConflictFreeDocument<PrefixT>): Promise<ThisType<PrefixT>> {
    const cloned = out ?? new ConflictFreeDocument<PrefixT>(this.prefix);
    cloned.#yDoc = cloneYDoc(this.#yDoc);
    cloned.#deltaBasisYDoc = cloneYDoc(this.#deltaBasisYDoc);
    cloned.#fieldInfos = {
      array: new Set(this.#fieldInfos.array),
      boolean: new Set(this.#fieldInfos.boolean),
      map: new Set(this.#fieldInfos.map),
      numeric: new Set(this.#fieldInfos.numeric),
      object: new Set(this.#fieldInfos.object),
      restrictedText: new Set(this.#fieldInfos.restrictedText),
      set: new Set(this.#fieldInfos.set),
      text: new Set(this.#fieldInfos.text)
    };
    return cloned;
  }

  /** Returns a snapshot of new document without any of the history of the current document.  This means that the new snapshot cannot have
   * deltas applied to it from the current document -- but this saves a lot of storage space when a large number of edits have been
   * applied. */
  public encodeFlattenedSnapshot(
    newSnapshotId: string,
    { updateSnapshotId = true }: { updateSnapshotId?: boolean } = {}
  ): EncodedConflictFreeDocumentSnapshot<PrefixT> {
    const state = Y.encodeStateVector(new Y.Doc());
    const encodedBuffer = Y.encodeStateAsUpdateV2(makeFlattenedYDoc(this.#yDoc, { fieldInfos: this.#fieldInfos }), state);
    const output = this.#encodedConflictFreeDocumentSnapshotInfo.makeWithBuffer(encodedBuffer);
    if (updateSnapshotId) {
      this.#snapshotId_ = newSnapshotId;
    }
    return output;
  }

  /** Encodes a snapshot, which is a single delta combining all of the previously applied deltas.  This is more space efficient for data
   * transfers because deleted content is garbage collected. */
  public encodeSnapshot(
    newSnapshotId: string,
    { updateSnapshotId = true }: { updateSnapshotId?: boolean } = {}
  ): EncodedConflictFreeDocumentSnapshot<PrefixT> {
    const state = Y.encodeStateVector(new Y.Doc());
    const encodedBuffer = Y.encodeStateAsUpdateV2(this.#yDoc, state);
    const output = this.#encodedConflictFreeDocumentSnapshotInfo.makeWithBuffer(encodedBuffer);
    if (updateSnapshotId) {
      this.#snapshotId_ = newSnapshotId;
    }
    return output;
  }

  /**
   * Applies the specified deltas and then, if `updateDeltaBasis` is `true`, updates the basis document to match the current document
   *
   * @param updateDeltaBasis - Default: `true`
   */
  public applyDeltas(
    deltas: Array<EncodedConflictFreeDocumentDelta<PrefixT>>,
    { updateDeltaBasis = true }: { updateDeltaBasis?: boolean } = {}
  ): void {
    for (const delta of deltas) {
      const encodedBuffer = this.#encodedConflictFreeDocumentDeltaInfo.toBuffer(delta);
      Y.applyUpdateV2(this.#yDoc, encodedBuffer);
    }

    this.#loadFieldInfos();

    if (updateDeltaBasis) {
      this.updateDeltaBasis();
    }
  }

  /** Sets the delta basis to the current state of the document */
  public updateDeltaBasis() {
    this.#deltaBasisYDoc = cloneYDoc(this.#yDoc);
  }

  /**
   * Encodes the delta from the last delta basis document and then, if `updateDeltaBasis` is `true`, updates the basis document to match the
   * current document
   *
   * @param updateDeltaBasis - Default: `true`
   * */
  public encodeDelta({ updateDeltaBasis = true }: { updateDeltaBasis?: boolean } = {}): EncodedConflictFreeDocumentDelta<PrefixT> {
    const state = Y.encodeStateVector(this.#deltaBasisYDoc);
    // #yDoc is the latest state of the document, which has potentially been modified beyond #deltaBasisYDoc
    const encodedBuffer = Y.encodeStateAsUpdateV2(this.#yDoc, state);
    if (updateDeltaBasis) {
      this.updateDeltaBasis();
    }
    return this.#encodedConflictFreeDocumentDeltaInfo.makeWithBuffer(encodedBuffer);
  }

  /** Computes the delta between two documents where the current document is considered to be the basis document */
  public diff(other: ConflictFreeDocument<PrefixT>): EncodedConflictFreeDocumentDelta<PrefixT> {
    const state = Y.encodeStateVector(this.#yDoc);
    const encodedBuffer = Y.encodeStateAsUpdateV2(other.#yDoc, state);
    return this.#encodedConflictFreeDocumentDeltaInfo.makeWithBuffer(encodedBuffer);
  }

  /** Computes the differences between two documents and then applies those differences onto this document */
  public merge(other: ConflictFreeDocument<PrefixT>, { updateDeltaBasis = true }: { updateDeltaBasis?: boolean } = {}) {
    this.applyDeltas([this.diff(other)], { updateDeltaBasis });
  }

  // Generic Field Access Methods

  #genericConflictFreeDocumentFieldAccessor: GenericConflictFreeDocumentFieldAccessor | undefined;
  public get generic() {
    if (this.#genericConflictFreeDocumentFieldAccessor === undefined) {
      this.#genericConflictFreeDocumentFieldAccessor = new GenericConflictFreeDocumentFieldAccessor(this.#yDoc, this.#fieldInfos);
    }
    return this.#genericConflictFreeDocumentFieldAccessor;
  }

  // Private Methods

  #loadFieldInfos() {
    const fieldNamesJson = this.#yDoc.getMap(fieldInfosFieldName).toJSON() ?? {};
    const deserialization = fieldNamesSchema.deserialize(fieldNamesJson);
    /* node:coverage disable */
    if (deserialization.error !== undefined) {
      throw new Error(`Failed to deserialize conflict free document: ${deserialization.error}`);
    }
    /* node:coverage enable */

    const newFieldInfos = makeConflictFreeDocumentFieldInfos();

    const fieldKeys = Object.keys(deserialization.deserialized) as Array<`${ConflictFreeDocumentFieldTypeName}:${string}`>;
    for (const fieldKey of fieldKeys) {
      const fieldNamePrefixMatch = fieldNamePrefixRegex.exec(fieldKey);
      /* node:coverage disable */
      if (fieldNamePrefixMatch === null) {
        continue; // Skipping
      }
      /* node:coverage enable */

      newFieldInfos[fieldNamePrefixMatch[1] as ConflictFreeDocumentFieldTypeName].add(fieldKey.substring(fieldNamePrefixMatch[0].length));
    }

    for (const fieldTypeName of conflictFreeDocumentFieldTypeNames) {
      this.#fieldInfos[fieldTypeName] = newFieldInfos[fieldTypeName];
    }
  }
}

// Helpers

const fieldNamePrefixRegex = new RegExp(`^(${conflictFreeDocumentFieldTypeNames.map(escapeRegExp).join('|')}):`);
const fieldNamesSchema = schema.record(
  schema.regex<`${ConflictFreeDocumentFieldTypeName}:${string}`>(fieldNamePrefixRegex),
  schema.boolean(true)
);
