import { Box, Button, FormControlLabel, Stack } from '@mui/material';
import type { MailCollectionType } from 'freedom-email-user';
import { mailCollectionTypes } from 'freedom-email-user';
import { LOCALIZE, PLURALIZE } from 'freedom-localization';
import { useP, useT } from 'freedom-react-localization';
import React from 'react';
import { BC, useBinding, useBindingEffect } from 'react-bindings';

import { Txt } from '../../../components/reusable/aliases/Txt.ts';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { ControlledCheckbox, ControlledCheckboxPlaceholder } from '../../../components/reusable/form/ControlledCheckbox.tsx';
import { ControlledSwitch, ControlledSwitchPlaceholder } from '../../../components/reusable/form/ControlledSwitch.tsx';
import { ControlledTextField, ControlledTextFieldPlaceholder } from '../../../components/reusable/form/ControlledTextField.tsx';
import { IconPlaceholder } from '../../../components/reusable/IconPlaceholder.tsx';
import { TxtPlaceholder } from '../../../components/reusable/TxtPlaceholder.tsx';
import { useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection.tsx';
import { MarkReadIcon } from '../../../icons/MarkReadIcon.ts';
import { RefreshIcon } from '../../../icons/RefreshIcon.ts';
import { SearchIcon } from '../../../icons/SearchIcon.ts';
import { $mailCollectionType } from '../../../localizations/mail-collection-types.ts';
import { formatInt } from '../../../utils/formatInt.ts';

const ns = 'ui';
const $searchPlaceholder = LOCALIZE('Search mail')({ ns });
const $unread = LOCALIZE('Unread')({ ns });
const $emails = PLURALIZE({
  one: LOCALIZE`${'count'} email`({ ns }),
  other: LOCALIZE`${'count'} emails`({ ns })
});

export const MailCollectionHeader = () => {
  const p = useP();
  const selectedCollectionId = useSelectedMailCollectionId();
  const t = useT();

  const lastDefinedCollectionId = useBinding(() => selectedCollectionId.get(), {
    id: 'lastDefinedCollectionId',
    detectChanges: true
  });

  useBindingEffect(
    selectedCollectionId,
    () => {
      const resolvedCollectionId = selectedCollectionId.get();
      if (resolvedCollectionId !== undefined) {
        lastDefinedCollectionId.set(resolvedCollectionId);
      }
    },
    { triggerOnMount: true, limitType: 'none' }
  );

  const showUnreadOnly = useBinding(() => false, { id: 'showUnreadOnly', detectChanges: true });
  const search = useBinding(() => '', { id: 'search', detectChanges: true });
  const selectAll = useBinding(() => false, { id: 'selectAll', detectChanges: true });

  return (
    <>
      <AppToolbar>
        {/* TODO: handle custom collection names */}
        <Txt variant="h3" className="flex-auto semibold">
          {BC(lastDefinedCollectionId, (collectionId) =>
            (collectionId !== undefined && mailCollectionTypes.has(collectionId)) || collectionId === 'drafts'
              ? $mailCollectionType[collectionId as MailCollectionType | 'drafts'](t)
              : null
          )}
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

            <Button sx={{ p: 1 }}>
              <RefreshIcon className="sm-icon secondary-text" />
            </Button>

            <Button sx={{ p: 1 }}>
              <MarkReadIcon className="sm-icon secondary-text" />
            </Button>
          </Stack>

          {/* TODO: TEMP value */}
          <Txt variant="body2">{$emails(1234, p, { count: formatInt(1234) })}</Txt>
        </Stack>
      </Stack>
    </>
  );
};

export const MailCollectionHeaderPlaceholder = () => {
  const t = useT();

  return (
    <>
      <AppToolbar justifyContent="space-between">
        <TxtPlaceholder variant="h3" className="semibold">
          {$mailCollectionType.inbox(t)}
        </TxtPlaceholder>
        <FormControlLabel
          control={<ControlledSwitchPlaceholder />}
          label={<TxtPlaceholder>{$unread(t)}</TxtPlaceholder>}
          labelPlacement="start"
        />
      </AppToolbar>

      <Stack alignItems="stretch" sx={{ px: 1.5 }}>
        <ControlledTextFieldPlaceholder helperText="" />

        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{ py: 2 }}>
          <Stack direction="row" alignItems="center" gap={2}>
            <ControlledCheckboxPlaceholder sx={{ ml: 1.5 }} />

            <Button sx={{ p: 1 }}>
              <IconPlaceholder className="sm-icon" />
            </Button>

            <Button sx={{ p: 1 }}>
              <IconPlaceholder className="sm-icon " />
            </Button>
          </Stack>

          <TxtPlaceholder variant="body2">{formatInt(1234)}</TxtPlaceholder>
        </Stack>
      </Stack>
    </>
  );
};
