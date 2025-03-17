import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ONE_DAY_MSEC, ONE_HOUR_MSEC, ONE_MIN_MSEC } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import type { TypeOrPromisedType } from 'yaschema';

import type { MailCollectionId } from '../../modules/mail-types/MailCollectionId.ts';
import type { MailThread } from '../../modules/mail-types/MailThread.ts';
import type { MailThreadId } from '../../modules/mail-types/MailThreadId.ts';
import { mailThreadIdInfo } from '../../modules/mail-types/MailThreadId.ts';

export interface GetMailThreadsForCollection_MailAddedPacket {
  readonly type: 'mail-added';
  readonly threads: MailThread[];
}

export interface GetMailThreadsForCollection_MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly ids: MailThreadId[];
}

export type GetMailThreadsForCollectionPacket = GetMailThreadsForCollection_MailAddedPacket | GetMailThreadsForCollection_MailRemovedPacket;

const globalCache: Record<MailCollectionId, MailThread[]> = {};

export const getMailThreadsForCollectionTask = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    _trace,
    collectionId: MailCollectionId,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailThreadsForCollectionPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailThreadsForCollection_MailAddedPacket> => {
    const cached = globalCache[collectionId];
    if (cached === undefined) {
      const mail: MailThread[] = [];

      const numEmails = [0, 1, 3, 10, 70, 100, 250, 1000, 10000][Math.floor(Math.random() * 9)];
      const now = Date.now();
      const startTimeMSec = now - Math.random() * ONE_DAY_MSEC - Math.random() * ONE_HOUR_MSEC - Math.random() * ONE_MIN_MSEC;
      const intervalPerEmail = (now - startTimeMSec) / numEmails;
      for (let i = 0; i < numEmails; i += 1) {
        mail.push({
          id: mailThreadIdInfo.make(`${collectionId}-${makeUuid()}`),
          from: 'brian@linefeedr.com',
          to: 'brian@linefeedr.com',
          subject: `(${i}) This is a sample subject, which could be a little long`,
          body: 'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?',
          timeMSec: startTimeMSec + i * intervalPerEmail,
          numMessages: numEmails,
          numUnread: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0
        });
      }

      globalCache[collectionId] = mail;
    }

    return makeSuccess({ type: 'mail-added' as const, threads: globalCache[collectionId] });
  }
);
