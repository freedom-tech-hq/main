import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { ONE_DAY_MSEC, ONE_HOUR_MSEC, ONE_MIN_MSEC } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import type { TypeOrPromisedType } from 'yaschema';

import type { Mail } from '../../modules/mail-types/Mail.ts';
import { type MailId, mailIdInfo } from '../../modules/mail-types/MailId.ts';
import type { MailThreadId } from '../../modules/mail-types/MailThreadId.ts';

export interface GetMailForThread_MailAddedPacket {
  readonly type: 'mail-added';
  readonly mail: Mail[];
}

export interface GetMailForThread_MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly ids: MailId[];
}

export type GetMailForThreadPacket = GetMailForThread_MailAddedPacket | GetMailForThread_MailRemovedPacket;

const globalCache: Record<MailThreadId, Mail[]> = {};

export const getMailForThreadTask = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    _trace,
    threadId: MailThreadId,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailForThreadPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailForThread_MailAddedPacket> => {
    const cached = globalCache[threadId];
    if (cached === undefined) {
      const mail: Mail[] = [];

      const numEmails = [1, 3, 10, 25][Math.floor(Math.random() * 4)];
      const now = Date.now();
      const startTimeMSec = now - Math.random() * ONE_DAY_MSEC - Math.random() * ONE_HOUR_MSEC - Math.random() * ONE_MIN_MSEC;
      const intervalPerEmail = (now - startTimeMSec) / numEmails;
      for (let i = 0; i < numEmails; i += 1) {
        mail.push({
          id: mailIdInfo.make(`${threadId}-${makeUuid()}`),
          from: 'brian@linefeedr.com',
          to: 'brian@linefeedr.com',
          subject: `(${i}) This is an example of a subject, which can be longer or shorter depending on what the user wants to type.`,
          body: 'But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?',
          timeMSec: startTimeMSec + i * intervalPerEmail,
          isUnread: true
        });
      }

      globalCache[threadId] = mail;
    }

    return makeSuccess({ type: 'mail-added' as const, mail: globalCache[threadId] });
  }
);
