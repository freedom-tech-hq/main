import type { PrefixedString, PrefixedStringInfo } from 'freedom-basic-data';
import { makePrefixedStringInfo } from 'freedom-basic-data';
import { omit } from 'lodash-es';

const base64StringRegex = /^[A-Za-z0-9+/]*={0,2}$/;

export const makeEncodedConflictFreeDocumentSnapshotInfo = <PrefixT extends string>(prefix: PrefixT) => {
  const prefixedStringInfo = makePrefixedStringInfo(`CRDT_B64_${prefix}_SNAP_`, {
    allowEmpty: true,
    isNonPrefixedValueValid: (nonPrefixedValue: string) => base64StringRegex.test(nonPrefixedValue)
  });

  return {
    ...omit(prefixedStringInfo, 'make'),
    makeWithBuffer: (buffer: Uint8Array | ArrayBuffer) => prefixedStringInfo.make(Buffer.from(buffer).toString('base64')),
    toBuffer: (encodedDoc: EncodedConflictFreeDocumentSnapshot<PrefixT>): Uint8Array =>
      Buffer.from(prefixedStringInfo.removePrefix(encodedDoc), 'base64')
  };
};

export interface EncodedConflictFreeDocumentSnapshotInfo<PrefixT extends string>
  extends Omit<PrefixedStringInfo<`CRDT_B64_${PrefixT}_SNAP_`>, 'make'> {
  makeWithBuffer: (buffer: Uint8Array | ArrayBuffer) => EncodedConflictFreeDocumentSnapshot<PrefixT>;
  toBuffer: (encodedDoc: EncodedConflictFreeDocumentSnapshot<PrefixT>) => Uint8Array;
}

export type EncodedConflictFreeDocumentSnapshot<PrefixT extends string> = PrefixedString<`CRDT_B64_${PrefixT}_SNAP_`>;
