import { List } from '@mui/material';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { WC } from 'react-waitables';

import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';
import { AccountListItemButton } from './AccountListItemButton.tsx';

export const AccountList = () => {
  const locallyStoredEncryptedEmailCredentials = useTaskWaitable((tasks) => tasks.listLocallyStoredEncryptedEmailCredentials(), {
    id: 'locallyStoredEncryptedEmailCredentials'
  });

  // TODO: TEMP
  const onAccountClick = (account: LocallyStoredEncryptedEmailCredentialInfo) => {
    console.log('clicked', account);
  };

  // TODO: TEMP
  return (
    <List>
      {WC(locallyStoredEncryptedEmailCredentials, (accounts) =>
        accounts.map((account) => <AccountListItemButton key={account.localUuid} account={account} onClick={onAccountClick} />)
      )}
    </List>
  );
};
