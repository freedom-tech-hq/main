import type { MessageFolder } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';

const ns = 'ui';

export const $apiGenericError = LOCALIZE('Something went wrong')({ ns });
export const $appName = LOCALIZE('Freedom Mail')({ ns });
export const $tryAgain = LOCALIZE('Try Again')({ ns });

export const $messageFolder = {
  drafts: LOCALIZE('Drafts')({ ns }),
  inbox: LOCALIZE('Inbox')({ ns }),
  outbox: LOCALIZE('Outbox')({ ns }),
  sent: LOCALIZE('Sent')({ ns })
} satisfies Record<MessageFolder, any>;
