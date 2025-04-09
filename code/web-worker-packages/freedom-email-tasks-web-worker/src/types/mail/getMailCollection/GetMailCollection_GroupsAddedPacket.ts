import type { MailCollectionGroup } from 'freedom-email-user';

export interface GetMailCollection_GroupsAddedPacket {
  readonly type: 'groups-added';
  readonly groups: MailCollectionGroup[];
}
