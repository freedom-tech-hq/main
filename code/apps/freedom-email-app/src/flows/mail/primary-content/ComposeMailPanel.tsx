import { Button, Stack } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React from 'react';
import { useCallbackRef } from 'react-bindings';

import { Txt } from '../../../components/reusable/aliases/Txt.ts';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { useMessagePresenter } from '../../../contexts/message-presenter.tsx';
import { DraftIcon } from '../../../icons/DraftIcon.ts';
import { TrashIcon } from '../../../icons/TrashIcon.ts';
import { ComposeMailInput } from '../secondary-content/ComposeMailInput/index.tsx';

const ns = 'ui';
const $compose = LOCALIZE('Compose')({ ns });
const $discard = LOCALIZE('Discard')({ ns });
const $saveDraft = LOCALIZE('Save as Draft')({ ns });

export const ComposeMailPanel = () => {
  const { presentErrorMessage } = useMessagePresenter();
  const t = useT();

  const onSaveAsDraftClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  const onDiscardClick = useCallbackRef(() => {
    // TODO: implement
    presentErrorMessage('This feature is not implemented yet.', { severity: 'error' });
  });

  return (
    <Stack alignItems="stretch" className="self-stretch flex-auto relative overflow-hidden">
      <Stack alignItems="stretch" className="relative flex-auto overflow-y-auto" sx={{ px: 2, pb: 2 }}>
        <AppToolbar justifyContent="space-between" gap={2} className="sticky top-0 default-bg z-5">
          <Txt variant="h3" className="semibold">
            {$compose(t)}
          </Txt>

          <Stack direction="row" alignItems="center" gap={1.5}>
            <Button
              title={$saveDraft(t)}
              startIcon={<DraftIcon className="sm-icon" />}
              onClick={onSaveAsDraftClick}
              className="default-text"
            >
              {$saveDraft(t)}
            </Button>

            <Button color="error" title={$discard(t)} startIcon={<TrashIcon color="error" className="sm-icon" />} onClick={onDiscardClick}>
              {$discard(t)}
            </Button>
          </Stack>
        </AppToolbar>
        <Stack className="flex-auto" sx={{ px: 1.5 }}>
          <ComposeMailInput onDiscardClick={onDiscardClick} />
        </Stack>
      </Stack>
    </Stack>
  );
};
