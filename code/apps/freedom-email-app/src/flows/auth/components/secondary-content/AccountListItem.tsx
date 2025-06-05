import { ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import { makeSuccess } from 'freedom-async';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import React from 'react';
import { useCallbackRef } from 'react-bindings';
import { WC } from 'react-waitables';

import { AvatarPlaceholder } from '../../../../components/reusable/AvatarPlaceholder.tsx';
import { BreakableEmailAddressTxt } from '../../../../components/reusable/BreakableEmailAddressTxt.tsx';
import { StringAvatar } from '../../../../components/reusable/StringAvatar.tsx';
import { TxtPlaceholder } from '../../../../components/reusable/TxtPlaceholder.tsx';
import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';

export type AccountListItemProps = (
  | { email: string; account?: undefined }
  | { email?: undefined; account: LocallyStoredEncryptedEmailCredentialInfo }
) & {
  onClick?: (account: LocallyStoredEncryptedEmailCredentialInfo) => void;
};

export const AccountListItem = ({ email, account, onClick }: AccountListItemProps) => {
  const loadedAccount = useTaskWaitable(
    async (tasks) => {
      if (account !== undefined) {
        return makeSuccess(account);
      }

      return await tasks.getLocallyStoredEncryptedEmailCredentialInfoByEmail(email);
    },
    { id: 'loadedAccount' }
  );

  const wrappedOnClick = useCallbackRef(() => {
    const theAccount = loadedAccount.value.get();
    if (theAccount === undefined) {
      return; // Not ready
    }

    onClick?.(theAccount);
  });

  const content = WC(
    loadedAccount,
    (account) => (
      <>
        <ListItemAvatar sx={{ mr: 1.5 }}>
          <StringAvatar value={account.email} />
        </ListItemAvatar>
        <ListItemText primary={<BreakableEmailAddressTxt>{account.email}</BreakableEmailAddressTxt>} />
      </>
    ),
    () => (
      <>
        <ListItemAvatar sx={{ mr: 1.5 }}>
          <AvatarPlaceholder />
        </ListItemAvatar>
        <ListItemText primary={<TxtPlaceholder>example@freedommail.me</TxtPlaceholder>} />
      </>
    )
  );

  if (onClick === undefined) {
    return <ListItem>{content}</ListItem>;
  } else {
    return <ListItemButton onClick={wrappedOnClick}>{content}</ListItemButton>;
  }
};
