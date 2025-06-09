import type { SvgIconComponent } from '@mui/icons-material';
import { Box } from '@mui/material';
import React from 'react';
import type { Binding } from 'react-bindings';

import { CenterIcon } from '../../../icons/CenterIcon.ts';
import { LeftAlignIcon } from '../../../icons/LeftAlignIcon.ts';
import { RightAlignIcon } from '../../../icons/RightAlignIcon.ts';
import type { TextAlignment } from '../../../types/TextAlignment.ts';
import { PopupButton } from '../PopupButton.tsx';
import { TextAlignmentButtonGroup } from './TextAlignmentButtonGroup.tsx';

export interface TextAlignmentPopupButtonProps {
  value: Binding<TextAlignment>;
}

export const TextAlignmentPopupButton = ({ value }: TextAlignmentPopupButtonProps) => (
  <PopupButton
    value={value}
    renderSelectedValue={(value) => {
      const IconComponent = iconComponentsByTextAlignment[value];
      return <IconComponent className="sm-icon secondary-text" />;
    }}
    renderPopoverContents={({ hide }) => (
      <Box sx={{ p: 1 }}>
        <TextAlignmentButtonGroup value={value} onValueSelected={hide} />
      </Box>
    )}
    popoverProps={{ transformOrigin: { horizontal: 'left', vertical: 'bottom' } }}
  />
);

// Helpers

const iconComponentsByTextAlignment: Record<TextAlignment, SvgIconComponent> = {
  left: LeftAlignIcon,
  center: CenterIcon,
  right: RightAlignIcon
};
