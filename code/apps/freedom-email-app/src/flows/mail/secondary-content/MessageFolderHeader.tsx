import { Button, FormControlLabel, Stack } from '@mui/material';
import { LOCALIZE, PLURALIZE } from 'freedom-localization';
import { useP, useT } from 'freedom-react-localization';
import React from 'react';
import type { ReadonlyBinding } from 'react-bindings';
import { BC, useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';

import { Txt } from '../../../components/reusable/aliases/Txt.ts';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { ControlledCheckbox } from '../../../components/reusable/form/ControlledCheckbox.tsx';
import { ControlledSwitch } from '../../../components/reusable/form/ControlledSwitch.tsx';
import { ControlledTextField } from '../../../components/reusable/form/ControlledTextField.tsx';
import { $messageFolder } from '../../../consts/common-strings.ts';
import { useMessagePresenter } from '../../../contexts/message-presenter.tsx';
import { useSelectedMessageFolder } from '../../../contexts/selected-message-folder.tsx';
import { MarkReadIcon } from '../../../icons/MarkReadIcon.ts';
import { RefreshIcon } from '../../../icons/RefreshIcon.ts';
import { SearchIcon } from '../../../icons/SearchIcon.ts';
import { formatInt } from '../../../utils/formatInt.ts';

const ns = 'ui';
const $markRead = LOCALIZE('Mark as Read')({ ns });
const $refresh = LOCALIZE('Refresh')({ ns });
const $searchPlaceholder = LOCALIZE('Search mail')({ ns });
const $unread = LOCALIZE('Unread')({ ns });
const $emails = PLURALIZE({
  one: LOCALIZE`${'count'} email`({ ns }),
  other: LOCALIZE`${'count'} emails`({ ns })
});

export interface MessageFolderHeaderProps {
  estThreadCount: ReadonlyBinding<number>;
}

export const MessageFolderHeader = ({ estThreadCount }: MessageFolderHeaderProps) => {
  const { presentErrorMessage } = useMessagePresenter();
  const p = useP();
  const selectedMessageFolder = useSelectedMessageFolder();
  const t = useT();

  const lastDefinedSelectedMessageFolder = useBinding(() => selectedMessageFolder.get(), {
    id: 'lastDefinedSelectedMessageFolder',
    detectChanges: true
  });

  useBindingEffect(
    selectedMessageFolder,
    () => {
      const folder = selectedMessageFolder.get();
      if (folder !== undefined) {
        lastDefinedSelectedMessageFolder.set(folder);
      }
    },
    { triggerOnMount: true, limitType: 'none' }
  );

  const showUnreadOnly = useBinding(() => false, { id: 'showUnreadOnly', detectChanges: true });
  const search = useBinding(() => '', { id: 'search', detectChanges: true });
  const selectAll = useBinding(() => false, { id: 'selectAll', detectChanges: true });

  const onMarkReadClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onRefreshClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  return (
    <>
      <AppToolbar>
        {/* TODO: handle custom folder names */}
        <Txt variant="h3" className="flex-auto semibold">
          {BC(lastDefinedSelectedMessageFolder, (folder) => (folder !== undefined ? $messageFolder[folder](t) : null))}
        </Txt>
        <FormControlLabel control={<ControlledSwitch checked={showUnreadOnly} />} label={$unread(t)} labelPlacement="start" />
      </AppToolbar>

      <Stack alignItems="stretch" sx={{ px: 1.5 }}>
        <ControlledTextField
          value={search}
          placeholder={$searchPlaceholder(t)}
          helperText=""
          slotProps={{ input: { startAdornment: <SearchIcon className="sm-icon secondary-text" sx={{ mr: 1 }} /> } }}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ py: 2 }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <ControlledCheckbox checked={selectAll} sx={{ ml: 1.5 }} />

            <Button sx={{ p: 1 }} title={$refresh(t)} onClick={onRefreshClick}>
              <RefreshIcon className="sm-icon secondary-text" />
            </Button>

            <Button sx={{ p: 1 }} title={$markRead(t)} onClick={onMarkReadClick}>
              <MarkReadIcon className="sm-icon secondary-text" />
            </Button>
          </Stack>

          {BC(estThreadCount, (count) => (
            <Txt variant="body2">{$emails(count, p, { count: formatInt(count) })}</Txt>
          ))}
        </Stack>
      </Stack>
    </>
  );
};
