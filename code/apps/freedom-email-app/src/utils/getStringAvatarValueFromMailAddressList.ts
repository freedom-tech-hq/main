import { isMailAddressGroup, type MailAddressList } from 'freedom-email-api';

export const getStringAvatarValueFromMailAddressList = (value: MailAddressList): string | undefined => {
  const firstAddress = value[0];
  if (firstAddress === undefined) {
    return undefined;
  }

  if (isMailAddressGroup(firstAddress)) {
    return firstAddress.groupName;
  }

  return (firstAddress.name?.length ?? 0) > 0 ? firstAddress.name : firstAddress.address;
};
