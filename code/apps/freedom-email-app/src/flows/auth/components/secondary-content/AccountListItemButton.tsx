import { ListItemAvatar, ListItemButton, ListItemText } from '@mui/material';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { useCallbackRef } from 'react-bindings';

import { Txt } from '../../../../components/reusable/aliases/Txt.tsx';
import { StringAvatar } from '../../../../components/reusable/StringAvatar.tsx';

export interface AccountListItemButtonProps {
  account: LocallyStoredEncryptedEmailCredentialInfo;
  onClick: (account: LocallyStoredEncryptedEmailCredentialInfo) => void;
}

export const AccountListItemButton = ({ account, onClick }: AccountListItemButtonProps) => {
  const wrappedOnClick = useCallbackRef(() => onClick(account));

  const description = account.description;
  let indexOfFirstAt = description.indexOf('@');
  if (indexOfFirstAt < 0) {
    indexOfFirstAt = description.length; // If no '@' found, use the full string
  }

  const [namePart, domainPart] = [description.substring(0, indexOfFirstAt), description.substring(indexOfFirstAt)];

  return (
    <ListItemButton onClick={wrappedOnClick}>
      <ListItemAvatar sx={{ minWidth: 0, mr: 1.5 }}>
        <StringAvatar value={description} sx={{ borderRadius: 3 }} />
      </ListItemAvatar>
      <ListItemText
        primary={
          <Txt>
            <span style={{ wordBreak: 'break-all' }}>{namePart}</span>
            <span style={{ display: 'inline-block' }}>
              {`\u200B`}
              <span style={{ wordBreak: 'break-all' }}>{domainPart}</span>
            </span>
          </Txt>
        }
      />
    </ListItemButton>
  );
};
