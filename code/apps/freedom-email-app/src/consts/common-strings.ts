import type { MessageFolder } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';

const ns = 'ui';

export const $appName = LOCALIZE('Freedom Mail')({ ns });
export const $cancel = LOCALIZE('Cancel')({ ns });
export const $continue = LOCALIZE('Continue')({ ns });
export const $genericError = LOCALIZE('Something went wrong')({ ns });
export const $tryAgain = LOCALIZE('Try Again')({ ns });

export const $messageFolder = {
  drafts: LOCALIZE('Drafts')({ ns }),
  inbox: LOCALIZE('Inbox')({ ns }),
  outbox: LOCALIZE('Outbox')({ ns }),
  sent: LOCALIZE('Sent')({ ns })
} satisfies Record<MessageFolder, any>;
