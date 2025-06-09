import { List, ListItemButton, ListItemText } from '@mui/material';
import type { LocalizableStringResolver } from 'freedom-localization';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React from 'react';
import type { Binding } from 'react-bindings';

import { PopupButton } from '../../../../components/reusable/PopupButton.tsx';
import type { MailTextStyle } from '../../../../types/MailTextStyle.ts';
import { mailTextStyles } from '../../../../types/MailTextStyle.ts';

const ns = 'ui';
const $textStyles: Record<MailTextStyle, LocalizableStringResolver> = {
  blockquote: LOCALIZE('Block Quote')({ ns }),
  code: LOCALIZE('Code')({ ns }),
  heading1: LOCALIZE('Heading 1')({ ns }),
  heading2: LOCALIZE('Heading 2')({ ns }),
  heading3: LOCALIZE('Heading 3')({ ns }),
  heading4: LOCALIZE('Heading 4')({ ns }),
  heading5: LOCALIZE('Heading 5')({ ns }),
  heading6: LOCALIZE('Heading 6')({ ns }),
  normal: LOCALIZE('Normal Text')({ ns })
};

export interface MailTextStylesPopupButtonProps {
  textStyle: Binding<MailTextStyle>;
}

export const MailTextStylesPopupButton = ({ textStyle }: MailTextStylesPopupButtonProps) => {
  const t = useT();

  return (
    <PopupButton
      value={textStyle}
      renderSelectedValue={(textStyle) => $textStyles[textStyle](t)}
      renderPopoverContents={({ selectValue }) => (
        <List>
          {mailTextStyles.map((textStyle) => (
            <ListItemButton key={textStyle} onClick={() => selectValue(textStyle)}>
              <ListItemText>{$textStyles[textStyle](t)}</ListItemText>
            </ListItemButton>
          ))}
        </List>
      )}
      buttonProps={{
        color: 'inherit',
        variant: 'outlined',
        className: 'default-text',
        sx: { minWidth: '10em' }
      }}
      popoverProps={{
        anchorOrigin: { horizontal: 'left', vertical: 'top' },
        transformOrigin: { horizontal: 'left', vertical: 'bottom' }
      }}
    />
  );
};
