import type { SvgIconComponent } from '@mui/icons-material';
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import type { LocalizableStringResolver } from 'freedom-localization';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React from 'react';
import type { Binding } from 'react-bindings';

import { PopupButton } from '../../../../components/reusable/PopupButton.tsx';
import { ForwardIcon } from '../../../../icons/ForwardIcon.ts';
import { ReplyAllIcon } from '../../../../icons/ReplyAllIcon.ts';
import { ReplyIcon } from '../../../../icons/ReplyIcon.ts';
import type { ReferencedMailCompositionMode } from '../../../../types/ReferencedMailCompositionMode.ts';

const ns = 'ui';
const $modes: Record<ReferencedMailCompositionMode, LocalizableStringResolver> = {
  forward: LOCALIZE('Forward')({ ns }),
  reply: LOCALIZE('Reply')({ ns }),
  'reply-all': LOCALIZE('Reply All')({ ns })
};

export interface ReferencedMailCompositionModePopupButtonProps {
  mode: Binding<ReferencedMailCompositionMode>;
}

export const ReferencedMailCompositionModePopupButton = ({ mode }: ReferencedMailCompositionModePopupButtonProps) => {
  const t = useT();

  return (
    <PopupButton
      value={mode}
      renderSelectedValue={(mode) => {
        const IconComponent = iconComponentsByMode[mode];
        return <IconComponent className="sm-icon muted-text" />;
      }}
      renderPopoverContents={({ selectValue }) => (
        <List>
          {orderedModes.map((mode) => {
            const IconComponent = iconComponentsByMode[mode];
            return (
              <ListItemButton key={mode} onClick={() => selectValue(mode)}>
                <ListItemIcon>
                  <IconComponent className="sm-icon muted-text" />
                </ListItemIcon>
                <ListItemText primary={$modes[mode](t)} />
              </ListItemButton>
            );
          })}
        </List>
      )}
    />
  );
};

// Helpers

const orderedModes: ReferencedMailCompositionMode[] = ['reply', 'reply-all', 'forward'];

const iconComponentsByMode: Record<ReferencedMailCompositionMode, SvgIconComponent> = {
  forward: ForwardIcon,
  reply: ReplyIcon,
  'reply-all': ReplyAllIcon
};
