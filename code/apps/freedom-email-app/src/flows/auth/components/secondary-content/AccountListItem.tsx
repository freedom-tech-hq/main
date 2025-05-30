import { ListItem, ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { useCallbackRef } from 'react-bindings';

import { BreakableEmailAddressTxt } from '../../../../components/reusable/BreakableEmailAddressTxt.tsx';
import { StringAvatar } from '../../../../components/reusable/StringAvatar.tsx';

export interface AccountListItemProps {
  account: LocallyStoredEncryptedEmailCredentialInfo;
  onClick?: (account: LocallyStoredEncryptedEmailCredentialInfo) => void;
}

export const AccountListItem = ({ account, onClick }: AccountListItemProps) => {
  const wrappedOnClick = useCallbackRef(() => onClick?.(account));

  const content = (
    <>
      <ListItemAvatar sx={{ mr: 1.5 }}>
        <StringAvatar value={account.email} />
      </ListItemAvatar>
      <ListItemText primary={<BreakableEmailAddressTxt>{account.email}</BreakableEmailAddressTxt>} />
    </>
  );

  if (onClick === undefined) {
    return <ListItem>{content}</ListItem>;
  } else {
    return <ListItemButton onClick={wrappedOnClick}>{content}</ListItemButton>;
  }
};
