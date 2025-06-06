import type { MailAddress, MailAddressGroup, MailAddressList } from 'freedom-email-api';
import { isMailAddressGroup } from 'freedom-email-api';
import { type ReactNode } from 'react';

export const makeTagsFromMailAddressList = (
  addressList: MailAddressList,
  {
    single,
    group
  }: {
    single: (parsed: MailAddress, index: number) => ReactNode;
    group: (parsed: MailAddressGroup, index: number) => ReactNode;
  }
): ReactNode[] =>
  addressList.map((entry, index) => {
    if (isMailAddressGroup(entry)) {
      return group(entry, index);
    } else {
      return single(entry, index);
    }
  });
