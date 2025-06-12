import { Stack } from '@mui/material';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useElementHeightBinding } from 'freedom-web-resize-observer';
import React from 'react';
import { useBinding, useBindingEffect, useDerivedBinding } from 'react-bindings';

import { sp } from '../../../components/bootstrapping/AppTheme.tsx';
import { BoundStyles, dynamicStyle } from '../../../components/BoundStyles.tsx';
import { secondarySidebarWidthPx } from '../../../consts/sizes.ts';
import { ScrollParentInfoProvider } from '../../../contexts/scroll-parent-info.tsx';
import { useSelectedMessageFolder } from '../../../contexts/selected-message-folder.tsx';
import { useIsSizeClass } from '../../../hooks/useIsSizeClass.ts';
import { useUuid } from '../../../hooks/useUuid.ts';
import { MailThreadsList } from '../secondary-content/MailThreadsList/index.tsx';
import { MessageFolderHeader } from '../secondary-content/MessageFolderHeader.tsx';

export const SecondaryMailSidebar = () => {
  const isMdOrSmaller = useIsSizeClass('<=', 'md');
  const selectedMessageFolder = useSelectedMessageFolder();
  const hasSelectedMessageFolder = useDerivedBinding(selectedMessageFolder, (id) => id !== undefined, { id: 'hasSelectedCollectionId' });
  const estThreadCount = useBinding(() => 0, { id: 'estThreadCount', detectChanges: true });
  const uuid = useUuid();

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

  const scrollableHeightPx = useElementHeightBinding(`${uuid}-scrollable`);
  const topToolbarHeightPx = useElementHeightBinding(`${uuid}-top-toolbar`);
  const scrollParentVisibleHeightPx = useDerivedBinding(
    { scrollableHeightPx, topToolbarHeightPx },
    ({ scrollableHeightPx, topToolbarHeightPx }) => scrollableHeightPx - topToolbarHeightPx,
    { id: 'scrollParentVisibleHeightPx' }
  );

  return (
    <BoundStyles
      component={Stack}
      alignItems="stretch"
      className="relative overflow-hidden"
      {...dynamicStyle({ hasSelectedMessageFolder, isMdOrSmaller }, ({ hasSelectedMessageFolder, isMdOrSmaller }) => ({
        // Not transitioned for md and smaller devices since this is presented as a whole page
        transition: isMdOrSmaller ? '' : `margin-left ${ANIMATION_DURATION_MSEC}ms ease-in-out`,
        marginLeft: isMdOrSmaller || hasSelectedMessageFolder ? '0px' : `-${secondarySidebarWidthPx}px`,
        width: isMdOrSmaller ? '100%' : `${secondarySidebarWidthPx}px`
      }))}
    >
      <ScrollParentInfoProvider insetTopPx={topToolbarHeightPx} heightPx={scrollableHeightPx} visibleHeightPx={scrollParentVisibleHeightPx}>
        <BoundStyles
          component={Stack}
          id={`${uuid}-scrollable`}
          alignItems="stretch"
          className="relative overflow-y-auto"
          {...dynamicStyle(isMdOrSmaller, (isMdOrSmaller) => ({ padding: `0 ${sp(isMdOrSmaller ? 0.5 : 2)}px` }))}
        >
          <Stack id={`${uuid}-top-toolbar`} alignItems="stretch" className="sticky top-0 default-bg z-5">
            <MessageFolderHeader estThreadCount={estThreadCount} />
          </Stack>

          {/* TODO: handle onArrowLeft/right */}
          <Stack alignItems="stretch" sx={{ px: 1.5 }}>
            <MailThreadsList
              folder={lastDefinedSelectedMessageFolder}
              estThreadCount={estThreadCount}
              scrollParent={`${uuid}-scrollable`}
            />
          </Stack>
        </BoundStyles>
      </ScrollParentInfoProvider>
    </BoundStyles>
  );
};
