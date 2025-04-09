import type { GetMailThreadsForCollection_MailAddedPacket } from './GetMailThreadsForCollection_MailAddedPacket.ts';
import type { GetMailThreadsForCollection_MailRemovedPacket } from './GetMailThreadsForCollection_MailRemovedPacket.ts';

export type GetMailThreadsForCollectionPacket = GetMailThreadsForCollection_MailAddedPacket | GetMailThreadsForCollection_MailRemovedPacket;
