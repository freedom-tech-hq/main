import { pick } from 'lodash-es';

import type { MailMessage } from '../types/MailMessage.ts';

const openFields = [
  // prettier-fix
  'id',
  'userId',
  'transferredAt',
  'folder',
  'hasAttachments'
] as const satisfies (keyof MailMessage)[];

type OpenFields = Pick<MailMessage, (typeof openFields)[number]>;

export function getMessageOpenFields(message: OpenFields): OpenFields {
  return pick(message, openFields);
}
