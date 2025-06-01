import { pick } from 'lodash-es';

import type { AllFieldsOfMessage } from '../types/AllFieldsOfMessage.ts';

const openFields = [
  // prettier-fix
  'id',
  'userId',
  'transferredAt',
  'folder',
  'hasAttachments'
] as const satisfies (keyof AllFieldsOfMessage)[];

type OpenFields = Pick<AllFieldsOfMessage, (typeof openFields)[number]>;

export function getMessageOpenFields(message: OpenFields): OpenFields {
  return pick(message, openFields);
}
