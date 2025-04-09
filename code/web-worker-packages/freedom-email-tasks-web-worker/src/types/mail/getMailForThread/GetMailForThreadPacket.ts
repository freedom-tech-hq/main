import type { GetMailForThread_MailAddedPacket } from './GetMailForThread_MailAddedPacket.ts';
import type { GetMailForThread_MailRemovedPacket } from './GetMailForThread_MailRemovedPacket.ts';

export type GetMailForThreadPacket = GetMailForThread_MailAddedPacket | GetMailForThread_MailRemovedPacket;
