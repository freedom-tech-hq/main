import { Box, Collapse, Drawer, useTheme } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import { TARGET_FPS_MSEC } from 'freedom-web-animation';
import type { FocusControls } from 'freedom-web-focus';
import { useMemo, useRef } from 'react';
import { BC, useBindingEffect, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { useActiveUserId } from '../../contexts/active-user-id.tsx';
import { useSelectedMailCollectionId } from '../../contexts/selected-mail-collection.tsx';
import { useSideMenuWidth } from '../../contexts/side-menu-width.tsx';
import { useAppBarHeight } from '../../hooks/useAppBarHeight.ts';
import { MailMenuContent } from './MailMenuContent.tsx';
import { MainMenuContent } from './MainMenuContent.tsx';

export const MAIN_MENU_WIDTH_PX = 240;
export const MAIL_MENU_WIDTH_PX = 320;

export const SideMenu = () => {
  const uuid = useMemo(() => makeUuid(), []);
  const activeUserId = useActiveUserId();
  const appBarHeight = useAppBarHeight();
  const selectedCollectionId = useSelectedMailCollectionId();
  const sideMenuWidth = useSideMenuWidth();
  const theme = useTheme();

  const hasActiveUserId = useDerivedBinding(activeUserId, (activeUserId) => activeUserId !== undefined, { id: 'hasActiveUserId' });
  const hasSelectedCollection = useDerivedBinding(selectedCollectionId, (selectedCollectionId) => selectedCollectionId !== undefined, {
    id: 'hasSelectedCollection'
  });

  useBindingEffect(
    appBarHeight,
    (appBarHeight) => {
      const elem = document.getElementById(`${uuid}-content-offset`);
      if (elem === null) {
        return;
      }

      elem.style.paddingTop = `${appBarHeight}px`;
    },
    { limitMSec: TARGET_FPS_MSEC }
  );

  const computedSideMenuWidth = useDerivedBinding(
    { hasActiveUserId, hasSelectedCollection },
    ({ hasActiveUserId, hasSelectedCollection }) =>
      hasActiveUserId ? MAIN_MENU_WIDTH_PX + (hasSelectedCollection ? MAIL_MENU_WIDTH_PX : 0) : 0,
    { id: 'computedSideMenuWidth' }
  );
  useBindingEffect(computedSideMenuWidth, (computedSideMenuWidth) => sideMenuWidth.set(computedSideMenuWidth), { triggerOnMount: true });

  const mainMenuControls = useRef<FocusControls>({});
  const mailMenuControls = useRef<FocusControls>({});

  const focusMainMenu = useCallbackRef(() => mainMenuControls.current.focus?.());
  const focusMailMenu = useCallbackRef(() => mailMenuControls.current.focus?.());

  return (
    <Drawer className="side-menu" variant="permanent">
      <Box
        id={`${uuid}-content-offset`}
        sx={{
          height: '100%',
          display: 'flex',
          pt: `${appBarHeight.get()}px`
        }}
      >
        {BC(hasActiveUserId, (hasActiveUserId) => (
          <Collapse in={hasActiveUserId} orientation="horizontal" unmountOnExit={true}>
            <Box
              id={`${uuid}-content-offset`}
              sx={{
                height: '100%',
                display: 'flex'
              }}
            >
              <Box
                id={`${uuid}-main-menu`}
                sx={{
                  width: MAIN_MENU_WIDTH_PX,
                  overflow: 'auto',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <MainMenuContent scrollParent={`${uuid}-main-menu`} controls={mainMenuControls.current} onArrowRight={focusMailMenu} />
              </Box>
              {BC(hasSelectedCollection, (hasSelectedCollection) => (
                <Collapse in={hasSelectedCollection} orientation="horizontal" unmountOnExit={true}>
                  <Box
                    id={`${uuid}-mail-menu`}
                    sx={{
                      borderLeft: `1px solid ${theme.palette.divider}`,
                      width: MAIL_MENU_WIDTH_PX,
                      overflow: 'auto',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <MailMenuContent scrollParent={`${uuid}-mail-menu`} controls={mailMenuControls.current} onArrowLeft={focusMainMenu} />
                  </Box>
                </Collapse>
              ))}
            </Box>
          </Collapse>
        ))}
      </Box>
    </Drawer>
  );
};
