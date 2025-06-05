import { Button } from '@mui/material';
import React from 'react';
import { BC, useCallbackRef } from 'react-bindings';

import { AvatarPlaceholder } from '../../../components/reusable/AvatarPlaceholder.tsx';
import { BreakableEmailAddressTxt } from '../../../components/reusable/BreakableEmailAddressTxt.tsx';
import { StringAvatar } from '../../../components/reusable/StringAvatar.tsx';
import { TxtPlaceholder } from '../../../components/reusable/TxtPlaceholder.tsx';
import { useActiveAccountInfo } from '../../../contexts/active-account-info.tsx';
import { useMessagePresenter } from '../../../contexts/message-presenter.tsx';
import { CollapseExpandIcon } from '../../../icons/CollapseExpandIcon.ts';

export const ActiveAccountButton = () => {
  const activeAccountInfo = useActiveAccountInfo();
  const { presentErrorMessage } = useMessagePresenter();

  const onClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  return BC(activeAccountInfo, (activeAccountInfo) =>
    activeAccountInfo !== undefined ? (
      <Button
        className="default-text"
        startIcon={<StringAvatar value={activeAccountInfo.email} />}
        endIcon={<CollapseExpandIcon className="sm-icon" />}
        onClick={onClick}
      >
        <BreakableEmailAddressTxt breakAnywhere={true} variant="caption" className="text-left">
          {activeAccountInfo.email}
        </BreakableEmailAddressTxt>
      </Button>
    ) : (
      <ActiveAccountButtonPlaceholder />
    )
  );
};

// Helpers

const ActiveAccountButtonPlaceholder = () => (
  <Button startIcon={<AvatarPlaceholder />} endIcon={<CollapseExpandIcon className="sm-icon" color="disabled" />} disabled>
    <TxtPlaceholder className="w-full" />
  </Button>
);
