import { Stack } from '@mui/material';

import { MailCollectionsList } from '../modules/mail-collections-list/components/MailCollectionsList.tsx';
import type { FocusControls } from '../types/FocusControls.ts';

export interface MainMenuContentProps {
  scrollParent: HTMLElement | string;
  controls?: FocusControls;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MainMenuContent = ({ scrollParent, controls, onArrowLeft, onArrowRight }: MainMenuContentProps) => (
  <Stack>
    <MailCollectionsList scrollParent={scrollParent} controls={controls} onArrowLeft={onArrowLeft} onArrowRight={onArrowRight} />
  </Stack>
);
