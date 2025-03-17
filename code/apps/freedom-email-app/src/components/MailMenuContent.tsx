import { Stack } from '@mui/material';

import { MailCollection } from '../modules/mail-collection/components/MailCollection.tsx';
import type { FocusControls } from '../types/FocusControls.ts';

export interface MailMenuContentProps {
  scrollParent: HTMLElement | string;
  controls?: FocusControls;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MailMenuContent = ({ scrollParent, controls, onArrowLeft, onArrowRight }: MailMenuContentProps) => (
  <Stack>
    <MailCollection scrollParent={scrollParent} controls={controls} onArrowLeft={onArrowLeft} onArrowRight={onArrowRight} />
  </Stack>
);
