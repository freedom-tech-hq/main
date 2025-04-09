import type { GetMailCollection_CollectionsAddedPacket } from './GetMailCollection_CollectionsAddedPacket.ts';
import type { GetMailCollection_CollectionsRemovedPacket } from './GetMailCollection_CollectionsRemovedPacket.ts';
import type { GetMailCollection_GroupsAddedPacket } from './GetMailCollection_GroupsAddedPacket.ts';
import type { GetMailCollection_GroupsRemovedPacket } from './GetMailCollection_GroupsRemovedPacket.ts';

export type GetMailCollectionPacket =
  | GetMailCollection_GroupsAddedPacket
  | GetMailCollection_GroupsRemovedPacket
  | GetMailCollection_CollectionsAddedPacket
  | GetMailCollection_CollectionsRemovedPacket;
