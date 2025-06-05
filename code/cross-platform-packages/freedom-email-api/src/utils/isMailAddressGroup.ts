import type { MailAddressGroup } from '../types/MailAddressGroup.ts';
import type { MailAddressListItem } from '../types/MailAddressListItem.ts';

export const isMailAddressGroup = (value: MailAddressListItem): value is MailAddressGroup =>
  'groupName' in value && typeof value.groupName === 'string';
