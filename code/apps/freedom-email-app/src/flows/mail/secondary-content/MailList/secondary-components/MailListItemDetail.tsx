import { Collapse, Divider, Stack, useTheme } from '@mui/material';
import { type DecryptedViewMessage } from 'freedom-email-api';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { once } from 'lodash-es';
import { generatePseudoWord } from 'pseudo-words';
import React from 'react';
import type { ReadonlyBinding } from 'react-bindings';
import { BC, ifBinding } from 'react-bindings';

import { Txt } from '../../../../../components/reusable/aliases/Txt.ts';
import { TxtPlaceholder } from '../../../../../components/reusable/TxtPlaceholder.tsx';
import { AttachmentButtonPlaceholder } from './AttachmentButton.tsx';

const ns = 'ui';
const $attachments = LOCALIZE('Attachments')({ ns });

export interface MailListItemDetailProps {
  mail: DecryptedViewMessage;
  showDividerIfCollapsed: boolean;
  isCollapsed: ReadonlyBinding<boolean>;
}

export const MailListItemDetail = ({ mail, showDividerIfCollapsed, isCollapsed }: MailListItemDetailProps) => {
  const theme = useTheme();

  return BC(isCollapsed, (isCollapsed) => (
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

          {/* TODO: support attachments */}
          {/* {IF(mail.attachments.length > 0, () => (
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
              ))} */}
        </Stack>
      </Collapse>
    </Stack>
  ));
};

export const MailListItemDetailPlaceholder = ({
  showDividerIfCollapsed = true,
  isCollapsed
}: {
  showDividerIfCollapsed?: boolean;
  isCollapsed?: ReadonlyBinding<boolean>;
}) => {
  const t = useT();
  const theme = useTheme();

  return BC(ifBinding(isCollapsed), () => {
    const resolvedIsCollapsed = isCollapsed?.get() ?? false;

    return (
      <Stack sx={{ minHeight: showDividerIfCollapsed ? `calc(${theme.spacing(6)} + 1px)` : undefined }}>
        <Collapse in={showDividerIfCollapsed && resolvedIsCollapsed} timeout={ANIMATION_DURATION_MSEC} className="absolute left-0 right-0">
          <Divider sx={{ my: 3 }} />
        </Collapse>
        <Collapse in={!resolvedIsCollapsed} timeout={ANIMATION_DURATION_MSEC}>
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
        </Collapse>
      </Stack>
    );
  });
};

// Helpers

const generatePlaceholderParagraph = once(() =>
  Array(Math.floor(Math.random() * 100 + 50))
    .fill(0)
    .map(() => generatePseudoWord())
    .join(' ')
);
