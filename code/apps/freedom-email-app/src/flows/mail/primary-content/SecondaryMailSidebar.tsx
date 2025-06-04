import { Button, FormControlLabel, Stack } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import type { MailCollectionType } from 'freedom-email-user';
import { mailCollectionTypes } from 'freedom-email-user';
import { LOCALIZE, PLURALIZE } from 'freedom-localization';
import { useP, useT } from 'freedom-react-localization';
import { useMemo } from 'react';
import { BC, useBinding, useBindingEffect, useDerivedBinding } from 'react-bindings';

import { Txt } from '../../../components/reusable/aliases/Txt.tsx';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { ControlledCheckbox } from '../../../components/reusable/form/ControlledCheckbox.tsx';
import { ControlledSwitch } from '../../../components/reusable/form/ControlledSwitch.tsx';
import { ControlledTextField } from '../../../components/reusable/form/ControlledTextField.tsx';
import { secondarySidebarWidthPx } from '../../../consts/sizes.ts';
import { useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection.tsx';
import { MarkReadIcon } from '../../../icons/MarkReadIcon.ts';
import { RefreshIcon } from '../../../icons/RefreshIcon.ts';
import { SearchIcon } from '../../../icons/SearchIcon.ts';
import { $mailCollectionType } from '../../../localizations/mail-collection-types.ts';
import { formatInt } from '../../../utils/formatInt.ts';
import { MailThreadsList } from '../secondary-content/MailThreadsList/index.tsx';

const ns = 'ui';
const $searchPlaceholder = LOCALIZE('Search mail')({ ns });
const $unread = LOCALIZE('Unread')({ ns });
const $emails = PLURALIZE({
  one: LOCALIZE`${'count'} email`({ ns }),
  other: LOCALIZE`${'count'} emails`({ ns })
});

// TODO: implement
export const SecondaryMailSidebar = () => {
  const p = useP();
  const t = useT();
  const uuid = useMemo(() => makeUuid(), []);

  const selectedCollectionId = useSelectedMailCollectionId();
  const hasSelectedCollectionId = useDerivedBinding(selectedCollectionId, (id) => id !== undefined, { id: 'hasSelectedCollectionId' });

  const lastDefinedCollectionId = useBinding(() => selectedCollectionId.get(), {
    id: 'lastSelectedCollectionId',
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

  useBindingEffect(
    hasSelectedCollectionId,
    () => {
      const elem = document.getElementById(uuid);
      if (elem === null) {
        return; // Not ready
      }

      elem.style.marginLeft = hasSelectedCollectionId.get() ? '0px' : `-${secondarySidebarWidthPx}px`;
    },
    { triggerOnMount: true }
  );

  return (
    <Stack
      id={uuid}
      alignItems="stretch"
      sx={{
        position: 'relative',
        marginLeft: hasSelectedCollectionId.get() ? '0px' : `-${secondarySidebarWidthPx}px`,
        overflow: 'hidden',
        transition: 'margin-left 300ms ease-in-out'
      }}
    >
      <Stack id={`${uuid}-scrollable`} alignItems="stretch" sx={{ overflowY: 'auto', width: `${secondarySidebarWidthPx}px` }}>
        <AppToolbar>
          {/* TODO: handle custom collection names */}
          <Txt variant="h3" className="semibold" sx={{ flex: 1 }}>
            {BC(lastDefinedCollectionId, (collectionId) =>
              (collectionId !== undefined && mailCollectionTypes.has(collectionId)) || collectionId === 'drafts'
                ? $mailCollectionType[collectionId as MailCollectionType | 'drafts'](t)
                : null
            )}
          </Txt>
          <FormControlLabel control={<ControlledSwitch checked={showUnreadOnly} />} label={$unread(t)} labelPlacement="start" />
        </AppToolbar>

        <ControlledTextField
          value={search}
          placeholder={$searchPlaceholder(t)}
          slotProps={{ input: { startAdornment: <SearchIcon className="sm-icon secondary-text" sx={{ mr: 1 }} /> } }}
        />

        <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
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

        {/* TODO: handle onArrowLeft/right */}
        <MailThreadsList collectionId={lastDefinedCollectionId} scrollParent={`${uuid}-scrollable`} />
      </Stack>
    </Stack>
  );
};
