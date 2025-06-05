import { Stack } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import React, { useMemo } from 'react';
import { useBinding, useBindingEffect, useDerivedBinding } from 'react-bindings';

import { secondarySidebarWidthPx } from '../../../consts/sizes.ts';
import { useSelectedMessageFolder } from '../../../contexts/selected-message-folder.tsx';
import { MailThreadsList } from '../secondary-content/MailThreadsList/index.tsx';
import { MessageFolderHeader } from '../secondary-content/MessageFolderHeader.tsx';

export const SecondaryMailSidebar = () => {
  const uuid = useMemo(() => makeUuid(), []);

  const selectedMessageFolder = useSelectedMessageFolder();
  const hasSelectedMessageFolder = useDerivedBinding(selectedMessageFolder, (id) => id !== undefined, { id: 'hasSelectedCollectionId' });

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

  useBindingEffect(
    hasSelectedMessageFolder,
    () => {
      const elem = document.getElementById(uuid);
      if (elem === null) {
        return; // Not ready
      }

      elem.style.marginLeft = hasSelectedMessageFolder.get() ? '0px' : `-${secondarySidebarWidthPx}px`;
    },
    { triggerOnMount: true }
  );

  return (
    <Stack
      id={uuid}
      alignItems="stretch"
      className="relative overflow-hidden"
      sx={{
        marginLeft: hasSelectedMessageFolder.get() ? '0px' : `-${secondarySidebarWidthPx}px`,
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
          <MessageFolderHeader />
        </Stack>

        {/* TODO: handle onArrowLeft/right */}
        <Stack alignItems="stretch" sx={{ px: 1.5 }}>
          <MailThreadsList folder={lastDefinedSelectedMessageFolder} scrollParent={`${uuid}-scrollable`} />
        </Stack>
      </Stack>
    </Stack>
  );
};
