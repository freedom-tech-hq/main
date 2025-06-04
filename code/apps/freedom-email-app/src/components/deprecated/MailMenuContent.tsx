import { Stack } from '@mui/material';
import type { FocusControls } from 'freedom-web-focus';

import { MailCollection } from '../../modules/mail-collection/components/MailCollection.tsx';

export interface MailMenuContentProps {
  scrollParent: HTMLElement | string | Window;
  controls?: FocusControls;
  onArrowLeft?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onArrowRight?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export const MailMenuContent = ({ scrollParent, controls, onArrowLeft, onArrowRight }: MailMenuContentProps) => (
  <Stack>
    <MailCollection scrollParent={scrollParent} controls={controls} onArrowLeft={onArrowLeft} onArrowRight={onArrowRight} />
  </Stack>
);
