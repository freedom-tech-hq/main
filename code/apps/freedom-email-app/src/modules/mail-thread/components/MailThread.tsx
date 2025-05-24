import type { SxProps, Theme } from '@mui/material';
import { Stack } from '@mui/material';
import { VirtualList } from 'freedom-web-virtual-list';
import { BC } from 'react-bindings';

import { AuxSearchField } from '../../../components/AuxSearchField.tsx';
import { useIsDataSourceLoadingBinding } from '../../../hooks/useIsDataSourceLoadingBinding.ts';
import { useMailThreadDataSource } from '../hooks/useMailThreadDataSource.ts';
import { useMailThreadDelegate } from '../hooks/useMailThreadDelegate.tsx';
import { MailThreadActionsMenu } from './MailThreadActionsMenu.tsx';

export interface MailThreadProps {
  scrollParent: HTMLElement | string | Window;
}

export const MailThread = ({ scrollParent }: MailThreadProps) => {
  const mailDataSource = useMailThreadDataSource();
  const isDataSourceLoading = useIsDataSourceLoadingBinding(mailDataSource);

  const mailDelegate = useMailThreadDelegate(mailDataSource);

  return (
    <Stack sx={{ mb: 3 }}>
      <Stack direction="row" justifyContent="flex-end" sx={innerToolbarStyle}>
        <AuxSearchField />
      </Stack>

      <VirtualList scrollParent={scrollParent} dataSource={mailDataSource} delegate={mailDelegate} />

      {BC(isDataSourceLoading, (isLoading) => (!isLoading || mailDataSource.getNumItems() > 0 ? <MailThreadActionsMenu /> : null))}
    </Stack>
  );
};

// Helpers

const innerToolbarStyle: SxProps<Theme> = { mb: 2, px: 3, pt: 3 };
