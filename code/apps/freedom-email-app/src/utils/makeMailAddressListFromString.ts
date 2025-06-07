import { parseAddressList } from 'email-addresses';
import type { MailAddressList, MailAddressListItem } from 'freedom-email-api';

export const makeMailAddressListFromString = (addresses: string): MailAddressList => {
  const parsed = parseAddressList(addresses);
  if (parsed === null) {
    return [];
  }

  return parsed.map((parsed): MailAddressListItem => {
    switch (parsed.type) {
      case 'group':
        return {
          groupName: parsed.name,
          addresses: parsed.addresses.map((member) => ({ name: member.name ?? undefined, address: member.address }))
        };
      case 'mailbox':
        return { name: parsed.name ?? undefined, address: parsed.address };
    }
  });
};
