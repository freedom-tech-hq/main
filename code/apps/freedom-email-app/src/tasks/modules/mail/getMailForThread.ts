import type { PR, Result } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { generalizeFailureResult } from 'freedom-common-errors';
import { prefixedUuidId } from 'freedom-sync-types';
import { getBundleAtPath, getJsonFromFile } from 'freedom-syncable-store-types';
import type { TypeOrPromisedType } from 'yaschema';

import type { Mail } from '../../../modules/mail-types/Mail.ts';
import { type MailId, mailIdInfo } from '../../../modules/mail-types/MailId.ts';
import { type MailThreadId, mailThreadIdInfo } from '../../../modules/mail-types/MailThreadId.ts';
import { MAIL_FOLDER_ID, MAIL_STORAGE_BUNDLE_ID } from '../../consts/user-syncable-paths.ts';
import { useActiveUserId } from '../../contexts/active-user-id.ts';
import { storedMailSchema } from '../../types/StoredMail.ts';
import { getUserFs } from '../internal/storage/getUserFs.ts';

export interface GetMailForThread_MailAddedPacket {
  readonly type: 'mail-added';
  readonly mail: Mail[];
}

export interface GetMailForThread_MailRemovedPacket {
  readonly type: 'mail-removed';
  readonly ids: MailId[];
}

export type GetMailForThreadPacket = GetMailForThread_MailAddedPacket | GetMailForThread_MailRemovedPacket;

// const globalCache: Record<MailThreadId, Mail[]> = {};

export const getMailForThread = makeAsyncResultFunc(
  [import.meta.filename],
  async (
    trace,
    threadId: MailThreadId,
    _isConnected: () => TypeOrPromisedType<boolean>,
    _onData: (value: Result<GetMailForThreadPacket>) => TypeOrPromisedType<void>
  ): PR<GetMailForThread_MailAddedPacket> => {
    const activeUserId = useActiveUserId(trace);

    if (activeUserId.userId === undefined) {
      return makeSuccess({ type: 'mail-added' as const, mail: [] });
    }

    const userFs = await getUserFs(trace, { userId: activeUserId.userId });
    if (!userFs.ok) {
      return userFs;
    }

    const mailFolderId = await MAIL_FOLDER_ID(userFs.value);
    const mailStorageBundleId = await MAIL_STORAGE_BUNDLE_ID(userFs.value);

    const mailStorageBundle = await getBundleAtPath(trace, userFs.value, userFs.value.path.append(mailFolderId, mailStorageBundleId));
    if (!mailStorageBundle.ok) {
      return generalizeFailureResult(trace, mailStorageBundle, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const mailId = mailIdInfo.make(mailThreadIdInfo.removePrefix(threadId));
    const storedMail = await getJsonFromFile(
      trace,
      userFs.value,
      mailStorageBundle.value.path.append(prefixedUuidId('file', mailId)),
      storedMailSchema
    );
    if (!storedMail.ok) {
      return generalizeFailureResult(trace, storedMail, ['not-found', 'deleted', 'wrong-type', 'untrusted', 'format-error']);
    }

    const mail: Mail[] = [
      {
        id: mailId,
        from: storedMail.value.from,
        to: storedMail.value.to,
        subject: storedMail.value.subject,
        body: storedMail.value.body,
        timeMSec: storedMail.value.timeMSec,
        isUnread: true
      }
    ];

    return makeSuccess({ type: 'mail-added' as const, mail });

    // const cached = globalCache[threadId];
    // if (cached === undefined) {
    //   const mail: Mail[] = [];

    //   const numEmails = [1, 3, 10, 25][Math.floor(Math.random() * 4)];
    //   const now = Date.now();
    //   const startTimeMSec = now - Math.random() * ONE_DAY_MSEC - Math.random() * ONE_HOUR_MSEC - Math.random() * ONE_MIN_MSEC;
    //   const intervalPerEmail = (now - startTimeMSec) / numEmails;
    //   for (let i = 0; i < numEmails; i += 1) {
    //     const numParagraphs = Math.floor(Math.random() * (paragraphs.length - 1)) + 1;
    //     mail.push({
    //       id: mailIdInfo.make(`${threadId}-${makeUuid()}`),
    //       from: 'brian@linefeedr.com',
    //       to: 'brian@linefeedr.com',
    //       subject: `(${i}) This is an example of a subject, which can be longer or shorter depending on what the user wants to type.`,
    //       body: Array(numParagraphs)
    //         .fill(0)
    //         .map(() => paragraphs[Math.floor(Math.random() * paragraphs.length)])
    //         .join('\n\n'),
    //       timeMSec: startTimeMSec + i * intervalPerEmail,
    //       isUnread: true
    //     });
    //   }

    //   globalCache[threadId] = mail;
    // }

    // return makeSuccess({ type: 'mail-added' as const, mail: globalCache[threadId] });
  }
);

// Helpers

// const paragraphs = [
//   'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam felis lectus, pellentesque ut urna quis, feugiat pharetra sem. Morbi aliquet convallis orci at suscipit. Quisque nisi urna, tincidunt nec felis vitae, consectetur hendrerit ligula. Sed faucibus enim in lorem volutpat placerat. Mauris eget massa id eros dictum iaculis. Cras nec lacinia orci. Fusce quis mi convallis, blandit dui vel, tempor libero. Cras sed vulputate leo, eu tincidunt velit. Phasellus nisi massa, venenatis quis varius in, pulvinar non purus. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Sed rutrum lorem elementum gravida aliquam. Aliquam mi sapien, vulputate ac pharetra non, pretium eu magna. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Maecenas aliquam orci odio, quis consequat tortor pellentesque sit amet. Quisque vitae arcu condimentum risus lobortis varius.',
//   'Integer imperdiet vehicula risus a vestibulum. Aenean nec ipsum sodales, rutrum orci vel, feugiat ipsum. Nulla non tortor aliquet, vulputate tortor vel, efficitur dolor. Pellentesque metus orci, pellentesque a pharetra non, condimentum nec turpis. Suspendisse fermentum augue turpis, vel dignissim lacus luctus sodales. Morbi vel tortor imperdiet, rhoncus nunc sed, placerat ipsum. Cras dapibus dui eu ex malesuada, et maximus risus venenatis. Interdum et malesuada fames ac ante ipsum primis in faucibus. Sed dictum mauris et leo hendrerit, eu dignissim nisl malesuada. Sed vulputate facilisis urna. Nunc euismod, turpis vel porta sodales, sem enim congue nulla, at ullamcorper velit erat at mauris. Aenean tristique purus et lectus ultricies ornare. Cras semper ipsum in leo elementum, et convallis orci venenatis. Phasellus pharetra et sapien eu interdum.',
//   'Sed id ornare urna. Curabitur felis leo, ultricies et bibendum sit amet, tincidunt vel ante. Suspendisse potenti. Sed sagittis lorem neque, maximus venenatis velit accumsan vel. Donec rutrum nisl eu vulputate condimentum. Pellentesque eget sem eget metus sollicitudin ullamcorper. Cras et viverra mi. Interdum et malesuada fames ac ante ipsum primis in faucibus. Fusce arcu lacus, placerat aliquet molestie et, viverra eget magna. Donec tristique nulla magna, id rutrum nulla ullamcorper a.',
//   'Sed rhoncus nibh erat. Curabitur id dolor at ligula egestas vestibulum et ut velit. Quisque sollicitudin turpis sit amet tellus lacinia faucibus. Donec in dignissim velit. Sed pretium ut dui a facilisis. Mauris nec massa at ligula semper pulvinar quis non odio. Sed tincidunt tempor neque. Suspendisse in mauris elit. Nunc sodales augue et massa tempor porttitor.',
//   'Quisque iaculis tellus ut risus accumsan sodales. Sed sit amet elit ut nisi mollis vulputate. Curabitur tincidunt, urna vel scelerisque elementum, augue nibh placerat sapien, sit amet laoreet nisi lorem vitae leo. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Aliquam odio urna, fringilla nec sollicitudin vitae, luctus vel ipsum. Vivamus in metus ante. Suspendisse porttitor lorem vel neque tempus varius. Nunc tristique malesuada ligula, et accumsan magna congue a. Integer feugiat risus metus, et vestibulum est ultricies eget.',
//   'Phasellus in luctus mi. Phasellus et sapien non nunc volutpat commodo et pellentesque lectus. Sed molestie libero dolor, a congue magna pellentesque sed. Etiam vitae egestas arcu. Nunc faucibus consectetur velit. Vestibulum imperdiet augue diam, a vulputate nisi sodales ac. Mauris cursus nisl eu nulla congue, id elementum sem porta. Donec laoreet mauris a felis fringilla, condimentum congue dolor tristique. Quisque pretium lacus sit amet mi elementum ornare. Morbi id mauris faucibus, placerat purus ac, pretium lectus.',
//   'Duis eleifend urna arcu, quis commodo neque ullamcorper sit amet. Etiam malesuada pulvinar sem. Suspendisse aliquam nulla ut orci imperdiet, in consequat augue lacinia. Nullam bibendum laoreet dui, ut maximus tortor suscipit quis. Pellentesque aliquam tortor eu congue convallis. Sed non consectetur lorem. Morbi nunc arcu, tempor et gravida eget, commodo nec mi. Integer urna justo, interdum sed sodales sit amet, aliquet id lectus. Aliquam dignissim condimentum mauris vel sagittis.',
//   'In ac enim malesuada, tincidunt tellus tristique, malesuada sapien. Vivamus lectus mauris, congue elementum tincidunt in, commodo eget elit. Aenean ipsum erat, hendrerit ut pellentesque et, porttitor et diam. Nulla leo ex, placerat in lorem eu, accumsan vulputate nibh. Aenean tincidunt scelerisque lorem ac viverra. Suspendisse potenti. Sed et nibh nunc.',
//   'Nullam eu nisi at turpis maximus feugiat. Interdum et malesuada fames ac ante ipsum primis in faucibus. Phasellus a urna in arcu sagittis congue ac quis libero. Aenean leo lectus, tristique quis ullamcorper ut, elementum nec sapien. Vestibulum iaculis, felis at maximus tincidunt, nunc mi congue mi, et iaculis ex magna at velit. Etiam commodo vitae felis vel aliquam. Donec accumsan est in libero elementum sollicitudin. Aliquam vitae justo quis velit ultricies luctus sit amet quis libero. Etiam vitae metus sit amet orci commodo mollis. Curabitur ultrices felis ac aliquam blandit. Nulla scelerisque magna ac commodo egestas. Nulla maximus ultricies sapien in dignissim. Etiam vulputate nisl mi, eget efficitur eros eleifend at. Morbi suscipit sem massa, eu semper tellus tempor et.',
//   'Donec quis nulla ante. Mauris tellus quam, mattis nec eleifend non, pharetra id nisl. Nunc non aliquam dolor. Maecenas blandit in lacus non accumsan. Etiam ullamcorper quam quis nibh viverra, eu convallis massa elementum. Mauris molestie lectus ex, auctor condimentum metus pretium vitae. Nulla cursus facilisis massa ac ornare. Suspendisse vel rutrum leo. Quisque sagittis est a diam rhoncus, vitae condimentum risus volutpat.'
// ];
