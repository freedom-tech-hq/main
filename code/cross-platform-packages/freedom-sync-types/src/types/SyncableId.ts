import type { Uuid } from 'freedom-basic-data';
import { makeIdInfo, nonAnchoredUuidRegex, uuidSchema } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { schema } from 'yaschema';

import type { SyncableItemType } from './SyncableItemType.ts';
import { abbreviatedSyncableItemType, abbreviatedSyncableItemTypes, syncableItemType } from './SyncableItemType.ts';

export type SyncableIdSettings =
  | SyncableItemType
  | {
      /** @defaultValue `true` */
      encrypted?: boolean;
      type: SyncableItemType;
    };

export interface ResolvedSyncableIdSettings {
  encrypted: boolean;
  type: SyncableItemType;
}

export const unmarkedSyncablePlainIdInfo = makeIdInfo('._');
export type UnmarkedSyncablePlainId = typeof unmarkedSyncablePlainIdInfo.schema.valueType;
export const plainId = (settings: SyncableIdSettings, plainId: string) =>
  makeSyncableId(settings, unmarkedSyncablePlainIdInfo.make(plainId));

export const saltIdInfo = makeIdInfo('SALT_');
export type SaltId = typeof saltIdInfo.schema.valueType;

export const defaultSaltId = saltIdInfo.make('default');

export const unmarkedSyncableSaltedIdInfo = makeIdInfo('S_');
export type UnmarkedSyncableSaltedId = typeof unmarkedSyncableSaltedIdInfo.schema.valueType;

export const unmarkedSyncableUuidSchema = uuidSchema;
export type UnmarkedSyncableUuidId = Uuid;
export const uuidId = (settings: SyncableIdSettings, uuid?: Uuid) => makeSyncableId(settings, uuid ?? makeUuid());

export const unmarkedSyncableIdSchema = schema.oneOf3(
  unmarkedSyncablePlainIdInfo.schema,
  unmarkedSyncableSaltedIdInfo.schema,
  unmarkedSyncableUuidSchema
);
export type UnmarkedSyncableId = typeof unmarkedSyncableIdSchema.valueType;

export const syncableIdSchema = schema.regex<SyncableId>(
  new RegExp(
    `E[yn]T[Fbf](?:${unmarkedSyncablePlainIdInfo.nonAnchoredRegex.source}|${unmarkedSyncableSaltedIdInfo.nonAnchoredRegex.source}|${nonAnchoredUuidRegex.source})`
  )
);
export type SyncableId = `E${'y' | 'n'}T${'F' | 'b' | 'f'}${UnmarkedSyncableId}`;

export const makeSyncableId = (settings: SyncableIdSettings, unmarkedId: UnmarkedSyncableId): SyncableId => {
  const encrypted = typeof settings === 'string' ? true : (settings.encrypted ?? true);
  const type = typeof settings === 'string' ? settings : settings.type;
  return `E${encrypted ? 'y' : 'n'}T${abbreviatedSyncableItemType[type]}${unmarkedId}`;
};

export const extractSyncableIdParts = (id: SyncableId): ResolvedSyncableIdSettings & { unmarkedId: UnmarkedSyncableId } => {
  const encrypted = id[1] === 'y';

  const typeMarker = abbreviatedSyncableItemTypes.checked(id[3]);
  if (typeMarker === undefined) {
    throw new Error(`Expected type marker to be one of: ${abbreviatedSyncableItemTypes.join(', ')}`);
  }
  const type = syncableItemType[typeMarker];

  const unmarkedId = id.slice(4) as UnmarkedSyncableId;

  return { encrypted, type, unmarkedId };
};
