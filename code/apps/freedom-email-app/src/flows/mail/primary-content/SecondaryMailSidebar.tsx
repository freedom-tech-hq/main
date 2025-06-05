import { Stack } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import { ELSE, IF } from 'freedom-logical-web-components';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import React, { useMemo } from 'react';
import { useBinding, useBindingEffect, useDerivedBinding } from 'react-bindings';

import { secondarySidebarWidthPx } from '../../../consts/sizes.ts';
import { useSelectedMailCollectionId } from '../../../contexts/selected-mail-collection-id.tsx';
import { MailCollectionHeader, MailCollectionHeaderPlaceholder } from '../secondary-content/MailCollectionHeader.tsx';
import { MailThreadsList } from '../secondary-content/MailThreadsList/index.tsx';

export const SecondaryMailSidebar = () => {
  const uuid = useMemo(() => makeUuid(), []);

  const selectedCollectionId = useSelectedMailCollectionId();
  const isInitialCollectionId = useDerivedBinding(selectedCollectionId, (id) => id === 'initial', { id: 'isInitialCollectionId' });
  const hasSelectedCollectionId = useDerivedBinding(selectedCollectionId, (id) => id !== undefined, {
    id: 'hasSelectedCollectionId'
  });

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
      className="relative overflow-hidden"
      sx={{
        marginLeft: hasSelectedCollectionId.get() ? '0px' : `-${secondarySidebarWidthPx}px`,
        transition: `margin-left ${ANIMATION_DURATION_MSEC}ms ease-in-out`
      }}
    >
      <Stack
        id={`${uuid}-scrollable`}
        alignItems="stretch"
        className="relative overflow-y-auto"
        sx={{ width: `${secondarySidebarWidthPx}px`, px: 2 }}
      >
        <Stack alignItems="stretch" className="sticky top-0 default-bg z-5">
          {IF(
            isInitialCollectionId,
            () => (
              <MailCollectionHeaderPlaceholder />
            ),
            ELSE(() => <MailCollectionHeader />)
          )}
        </Stack>

        {/* TODO: handle onArrowLeft/right */}
        <Stack alignItems="stretch" sx={{ px: 1.5 }}>
          <MailThreadsList collectionId={lastDefinedCollectionId} scrollParent={`${uuid}-scrollable`} />
        </Stack>
      </Stack>
    </Stack>
  );
};
