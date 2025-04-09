import type { MailCollectionType } from 'freedom-email-user';
import { LOCALIZE } from 'freedom-localization';

const ns = 'mail-collection-type';
export const $mailCollectionType = {
  archive: LOCALIZE('Archive')({ ns }),
  // custom not really used, but including for completeness
  custom: LOCALIZE('Custom')({ ns }),
  inbox: LOCALIZE('Inbox')({ ns }),
  sent: LOCALIZE('Sent')({ ns }),
  spam: LOCALIZE('Spam')({ ns }),
  trash: LOCALIZE('Trash')({ ns })
} satisfies Record<MailCollectionType, any>;
