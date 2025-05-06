import type { AnyPrefixedTimeId, AnyPrefixedUuid, TimeId, Uuid } from 'freedom-basic-data';
import {
  anyPrefixedTimeIdSchema,
  anyPrefixedUuidSchema,
  makeIdInfo,
  nonAnchoredAnyPrefixTimeIdRegex,
  nonAnchoredAnyPrefixUuidRegex,
  nonAnchoredUuidRegex,
  timeIdInfo,
  uuidSchema
} from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { schema } from 'yaschema';

import type { SyncableItemType } from './SyncableItemType.ts';
import { abbreviatedSyncableItemType } from './SyncableItemType.ts';

export interface SyncableIdConfig {
  /**
   * For folders, this must always be `true`.
   *
   * For bundles, this is the default encryption mode for the bundle.  Individual sub-bundles / files may have their own modes.
   *
   * For files, if this is `true`, the file is encrypted.  Otherwise it is plain.
   *
   * @defaultValue `true`
   */
  encrypted?: boolean;
  type: SyncableItemType;
}

export type SyncableIdSettings = SyncableItemType | SyncableIdConfig;

export interface ResolvedSyncableIdSettings {
  encrypted: boolean;
  type: SyncableItemType;
}

export const unmarkedSyncablePlainIdInfo = makeIdInfo('._');
export type UnmarkedSyncablePlainId = typeof unmarkedSyncablePlainIdInfo.schema.valueType;
export const plainId = (settings: SyncableIdSettings, plainId: string): SyncableId =>
  makeSyncableId(settings, unmarkedSyncablePlainIdInfo.make(plainId));

export const saltIdInfo = makeIdInfo('SALT_');
export type SaltId = typeof saltIdInfo.schema.valueType;

export const saltsByIdSchema = schema.record(saltIdInfo.schema, schema.string());
export type SaltsById = typeof saltsByIdSchema.valueType;

export const DEFAULT_SALT_ID = saltIdInfo.make('default');

export const unmarkedSyncableSaltedIdInfo = makeIdInfo('S_');
export type UnmarkedSyncableSaltedId = typeof unmarkedSyncableSaltedIdInfo.schema.valueType;

export const unmarkedSyncableUuidSchema = uuidSchema;
export type UnmarkedSyncableUuidId = Uuid;
export const uuidId = (settings: SyncableIdSettings, uuid?: Uuid): SyncableId => makeSyncableId(settings, uuid ?? makeUuid());

export const unmarkedTimeIdInfo = timeIdInfo;
export const unmarkedTimeIdSchema = unmarkedTimeIdInfo.schema;
export type UnmarkedTimeId = TimeId;

export const timeId = (settings: SyncableIdSettings, timeId?: TimeId): SyncableId => makeSyncableId(settings, timeId ?? timeIdInfo.make());

export const unmarkedPrefixedSyncableUuidSchema = anyPrefixedUuidSchema;
export type UnmarkedPrefixedSyncableUuidId = AnyPrefixedUuid;
export const prefixedUuidId = (settings: SyncableIdSettings, prefixedUuid: AnyPrefixedUuid): SyncableId =>
  makeSyncableId(settings, prefixedUuid);

export const unmarkedPrefixedSyncableTimeIdSchema = anyPrefixedTimeIdSchema;
export type UnmarkedPrefixedSyncableTimeIdId = AnyPrefixedTimeId;
export const prefixedTimeId = (settings: SyncableIdSettings, prefixedTimeId: AnyPrefixedTimeId): SyncableId =>
  makeSyncableId(settings, prefixedTimeId);

export const unmarkedSyncableIdSchema = schema.oneOf3(
  schema.oneOf(unmarkedSyncablePlainIdInfo.schema, unmarkedSyncableSaltedIdInfo.schema),
  schema.oneOf(unmarkedSyncableUuidSchema, unmarkedPrefixedSyncableUuidSchema),
  schema.oneOf(unmarkedTimeIdInfo.schema, unmarkedPrefixedSyncableTimeIdSchema)
);
export type UnmarkedSyncableId = typeof unmarkedSyncableIdSchema.valueType;

export const nonAnchoredSyncableIdRegex = new RegExp(
  `E[yn]T[Fbf](?:${unmarkedSyncablePlainIdInfo.nonAnchoredRegex.source}|${unmarkedSyncableSaltedIdInfo.nonAnchoredRegex.source}|${nonAnchoredUuidRegex.source}|${nonAnchoredAnyPrefixUuidRegex.source}|${unmarkedTimeIdInfo.nonAnchoredRegex.source}|${nonAnchoredAnyPrefixTimeIdRegex.source})`
);
export const syncableIdSchema = schema.regex<SyncableId>(new RegExp(`^${nonAnchoredSyncableIdRegex.source}$`));
export type SyncableId = `E${'y' | 'n'}T${'F' | 'b' | 'f'}${UnmarkedSyncableId}`;

export const makeSyncableId = (settings: SyncableIdSettings, unmarkedId: UnmarkedSyncableId): SyncableId => {
  const encrypted = typeof settings === 'string' ? true : (settings.encrypted ?? true);
  const type = typeof settings === 'string' ? settings : settings.type;
  return `E${encrypted ? 'y' : 'n'}T${abbreviatedSyncableItemType[type]}${unmarkedId}`;
};
