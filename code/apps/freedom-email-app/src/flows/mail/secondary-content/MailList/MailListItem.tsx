import { Collapse, Divider, Stack, useTheme } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useBindingPersistence } from 'freedom-react-binding-persistence';
import { useT } from 'freedom-react-localization';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { once } from 'lodash-es';
import { generatePseudoWord } from 'pseudo-words';
import React from 'react';
import { BC, useBinding, useCallbackRef } from 'react-bindings';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { TxtPlaceholder } from '../../../../components/reusable/TxtPlaceholder.tsx';
import { AttachmentButton, AttachmentButtonPlaceholder } from './AttachmentButton.tsx';
import { useMailListItemTransientStatesBindingPersistence } from './mail-list-item-transient-states-binding-persistence.tsx';
import type { MailListDataSourceMailItem } from './MailListDataSourceItem.ts';
import { MailListItemHeader, MailListItemHeaderPlaceholder } from './MailListItemHeader.tsx';

const ns = 'ui';
const $attachments = LOCALIZE('Attachments')({ ns });

export interface MailListItemProps extends Omit<MailListDataSourceMailItem, 'type'> {
  collapsedByDefault: boolean;
  showDividerIfCollapsed: boolean;
  showOptionsPerMessage: boolean;
}

export const MailListItem = ({ mail, collapsedByDefault, showDividerIfCollapsed, showOptionsPerMessage }: MailListItemProps) => {
  const mailListItemTransientStatesBindingPersistence = useMailListItemTransientStatesBindingPersistence();
  const t = useT();
  const theme = useTheme();

  const isCollapsed = useBindingPersistence(
    useBinding(() => collapsedByDefault, { id: 'isCollapsed', detectChanges: true }),
    { storage: mailListItemTransientStatesBindingPersistence, isValid: (value) => value !== undefined, key: `${mail.id}-isCollapsed` }
  );

  const onHeaderClick = useCallbackRef(() => isCollapsed.set(!isCollapsed.get()));

  return (
    <Stack className="default-bg">
      <MailListItemHeader mail={mail} showOptions={showOptionsPerMessage} onClick={onHeaderClick} />

      {BC(isCollapsed, (isCollapsed) => (
        <Stack sx={{ minHeight: showDividerIfCollapsed ? `calc(${theme.spacing(6)} + 1px)` : undefined }}>
          <Collapse in={showDividerIfCollapsed && isCollapsed} timeout={ANIMATION_DURATION_MSEC} className="absolute left-0 right-0">
            <Divider sx={{ my: 3 }} />
          </Collapse>
          <Collapse in={!isCollapsed} timeout={ANIMATION_DURATION_MSEC}>
            <Stack gap={3} sx={{ pl: 6, mt: 3, mb: 8 }}>
              <Txt variant="h1" className="semibold">
                {mail.subject}
              </Txt>

              <Txt variant="body1" className="medium whitespace-pre-line">
                {mail.body}
              </Txt>

              {IF(mail.attachments.length > 0, () => (
                <Stack sx={{ mt: 1 }} gap={2}>
                  <Txt variant="h3" color="textDisabled" className="semibold">
                    {$attachments(t)}
                  </Txt>
                  <Stack direction="row" gap={1.5}>
                    {mail.attachments.map((attachment) => (
                      <AttachmentButton key={attachment.id} attachment={attachment} />
                    ))}
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </Collapse>
        </Stack>
      ))}
    </Stack>
  );
};

export const MailListItemPlaceholder = () => {
  const t = useT();

  return (
    <Stack className="default-bg">
      <MailListItemHeaderPlaceholder />

      <Stack gap={3} sx={{ pl: 6, mt: 3, mb: 8 }}>
        <TxtPlaceholder variant="h1" className="semibold w-1/3" />

        <TxtPlaceholder variant="body1" className="medium">
          {generatePlaceholderParagraph()}
        </TxtPlaceholder>

        <Stack sx={{ mt: 1 }} gap={2}>
          <TxtPlaceholder variant="h3" color="textDisabled" className="semibold">
            {$attachments(t)}
          </TxtPlaceholder>
          <Stack direction="row" gap={1.5}>
            {Array(3)
              .fill(0)
              .map((_, index) => (
                <AttachmentButtonPlaceholder key={index} />
              ))}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

// Helpers

const generatePlaceholderParagraph = once(() =>
  Array(Math.floor(Math.random() * 100 + 50))
    .fill(0)
    .map(() => generatePseudoWord())
    .join(' ')
);
