import { pick } from 'lodash-es';

import type { DecryptedMessage } from '../types/DecryptedMessage.ts';

const openFields = [
  // prettier-fix
  'id',
  'userId',
  'transferredAt',
  'folder',
  'hasAttachments'
] as const satisfies (keyof DecryptedMessage)[];

type OpenFields = Pick<DecryptedMessage, (typeof openFields)[number]>;

export function getMessageOpenFields(message: OpenFields): OpenFields {
  return pick(message, openFields);
}
