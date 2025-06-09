import { Button, Stack } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React from 'react';
import { BC, type Binding, useCallbackRef } from 'react-bindings';

import { CenterIcon } from '../../../icons/CenterIcon.ts';
import { LeftAlignIcon } from '../../../icons/LeftAlignIcon.ts';
import { RightAlignIcon } from '../../../icons/RightAlignIcon.ts';
import type { TextAlignment } from '../../../types/TextAlignment.ts';

const ns = 'ui';
const $center = LOCALIZE('Center')({ ns });
const $leftAlign = LOCALIZE('Left Align')({ ns });
const $rightAlign = LOCALIZE('Right Align')({ ns });

export interface TextAlignmentButtonGroupProps {
  value: Binding<TextAlignment>;
  onValueSelected?: () => void;
}

export const TextAlignmentButtonGroup = ({ value, onValueSelected }: TextAlignmentButtonGroupProps) => {
  const t = useT();

  const onLeftAlignClick = useCallbackRef(() => {
    value.set('left');
    onValueSelected?.();
  });
  const onCenterClick = useCallbackRef(() => {
    value.set('center');
    onValueSelected?.();
  });
  const onRightAlignClick = useCallbackRef(() => {
    value.set('right');
    onValueSelected?.();
  });

  return BC(value, (value) => (
    <Stack direction="row" alignItems="center" gap={1}>
      <Button variant={value === 'left' ? 'contained' : 'text'} sx={{ p: 1 }} title={$leftAlign(t)} onClick={onLeftAlignClick}>
        <LeftAlignIcon className={`sm-icon ${value === 'left' ? 'primary-contrast' : 'secondary-text'}`} />
      </Button>

      <Button variant={value === 'center' ? 'contained' : 'text'} sx={{ p: 1 }} title={$center(t)} onClick={onCenterClick}>
        <CenterIcon className={`sm-icon ${value === 'center' ? 'primary-contrast' : 'secondary-text'}`} />
      </Button>

      <Button variant={value === 'right' ? 'contained' : 'text'} sx={{ p: 1 }} title={$rightAlign(t)} onClick={onRightAlignClick}>
        <RightAlignIcon className={`sm-icon ${value === 'right' ? 'primary-contrast' : 'secondary-text'}`} />
      </Button>
    </Stack>
  ));
};
