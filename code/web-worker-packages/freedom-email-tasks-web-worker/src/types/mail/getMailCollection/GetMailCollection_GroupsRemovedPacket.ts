import type { MailCollectionGroupId } from 'freedom-email-user';

export interface GetMailCollection_GroupsRemovedPacket {
  readonly type: 'groups-removed';
  readonly ids: MailCollectionGroupId[];
}
