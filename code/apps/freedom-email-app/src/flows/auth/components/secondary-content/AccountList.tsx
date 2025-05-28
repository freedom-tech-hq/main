import { List } from '@mui/material';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { WC } from 'react-waitables';

import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';
import { AccountListItem } from './AccountListItem.tsx';

export interface AccountListProps {
  onAccountClick: (account: LocallyStoredEncryptedEmailCredentialInfo) => void;
}

export const AccountList = ({ onAccountClick }: AccountListProps) => {
  const locallyStoredEncryptedEmailCredentials = useTaskWaitable((tasks) => tasks.listLocallyStoredEncryptedEmailCredentials(), {
    id: 'locallyStoredEncryptedEmailCredentials'
  });

  return (
    <List>
      {WC(locallyStoredEncryptedEmailCredentials, (accounts) =>
        accounts.map((account) => <AccountListItem key={account.localUuid} account={account} onClick={onAccountClick} />)
      )}
    </List>
  );
};
