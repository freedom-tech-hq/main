import { Button } from '@mui/material';
import React from 'react';
import { BC } from 'react-bindings';

import { AvatarPlaceholder } from '../../../components/reusable/AvatarPlaceholder.tsx';
import { BreakableEmailAddressTxt } from '../../../components/reusable/BreakableEmailAddressTxt.tsx';
import { StringAvatar } from '../../../components/reusable/StringAvatar.tsx';
import { TxtPlaceholder } from '../../../components/reusable/TxtPlaceholder.tsx';
import { useActiveAccountInfo } from '../../../contexts/active-account-info.tsx';
import { CollapseExpandIcon } from '../../../icons/CollapseExpandIcon.ts';

export interface ActiveAccountButtonProps {
  onClick?: () => void;
}

export const ActiveAccountButton = ({ onClick }: ActiveAccountButtonProps) => {
  const activeAccountInfo = useActiveAccountInfo();

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
      <Button startIcon={<AvatarPlaceholder />} endIcon={<CollapseExpandIcon className="sm-icon" color="disabled" />}>
        <TxtPlaceholder className="w-full" />
      </Button>
    )
  );
};
