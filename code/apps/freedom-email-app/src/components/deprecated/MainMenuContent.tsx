import { Stack } from '@mui/material';
import type { FocusControls } from 'freedom-web-focus';

import { MailCollectionsList } from '../../modules/mail-collections-list/components/MailCollectionsList.tsx';

export interface MainMenuContentProps {
  scrollParent: HTMLElement | string | Window;
  controls?: FocusControls;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MainMenuContent = ({ scrollParent, controls, onArrowLeft, onArrowRight }: MainMenuContentProps) => (
  <Stack>
    <MailCollectionsList scrollParent={scrollParent} controls={controls} onArrowLeft={onArrowLeft} onArrowRight={onArrowRight} />
  </Stack>
);
