import { Button, Stack } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import { LOCALIZE } from 'freedom-localization';
import { ELSE, IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import React, { useMemo } from 'react';
import { useDerivedBinding } from 'react-bindings';

import { Txt } from '../../../components/reusable/aliases/Txt.ts';
import { AppToolbar } from '../../../components/reusable/AppToolbar.tsx';
import { useSelectedMailThreadId } from '../../../contexts/selected-mail-thread.tsx';
import { ArchiveIcon } from '../../../icons/ArchiveIcon.ts';
import { ForwardIcon } from '../../../icons/ForwardIcon.ts';
import { MarkUnreadIcon } from '../../../icons/MarkUnreadIcon.ts';
import { MoreActionsIcon } from '../../../icons/MoreActionsIcon.ts';
import { ReplyAllIcon } from '../../../icons/ReplyAllIcon.ts';
import { ReplyIcon } from '../../../icons/ReplyIcon.ts';
import { SpamIcon } from '../../../icons/SpamIcon.ts';
import { TrashIcon } from '../../../icons/TrashIcon.ts';
import { MailList } from '../secondary-content/MailList/index.tsx';

const ns = 'ui';
const $forward = LOCALIZE('Forward')({ ns });
const $noThreadSelectedTitle = LOCALIZE('No Conversation Selected')({ ns });
const $noThreadSelectedInstructions = LOCALIZE('Select a conversation to read')({ ns });
const $reply = LOCALIZE('Reply')({ ns });
const $replyAll = LOCALIZE('Reply All')({ ns });

export const SelectedMailViewerPanel = () => {
  const t = useT();
  const uuid = useMemo(() => makeUuid(), []);

  const selectedThreadId = useSelectedMailThreadId();
  const hasSelectedThreadId = useDerivedBinding(selectedThreadId, (id) => id !== undefined, { id: 'hasSelectedThreadId' });

  return (
    <Stack alignItems="stretch" className="self-stretch flex-auto relative overflow-hidden">
      <Stack id={`${uuid}-scrollable`} alignItems="stretch" className="relative flex-auto overflow-y-auto">
        {IF(
          hasSelectedThreadId,
          () => (
            <>
              <AppToolbar justifyContent="space-between" gap={2} className="sticky top-0 default-bg z-5">
                <Stack direction="row" alignItems="center" gap={2}>
                  <Button sx={{ p: 1 }}>
                    <ArchiveIcon className="sm-icon secondary-text" />
                  </Button>

                  <Button sx={{ p: 1 }}>
                    <SpamIcon className="sm-icon secondary-text" />
                  </Button>

                  <Button sx={{ p: 1 }}>
                    <TrashIcon className="sm-icon secondary-text" />
                  </Button>

                  <Button sx={{ p: 1 }}>
                    <ReplyIcon className="sm-icon secondary-text" />
                  </Button>

                  <Button sx={{ p: 1 }}>
                    <ReplyAllIcon className="sm-icon secondary-text" />
                  </Button>

                  <Button sx={{ p: 1 }}>
                    <ForwardIcon className="sm-icon secondary-text" />
                  </Button>

                  <Button sx={{ p: 1 }}>
                    <MarkUnreadIcon className="sm-icon secondary-text" />
                  </Button>
                </Stack>

                <Button sx={{ p: 1 }}>
                  <MoreActionsIcon className="sm-icon secondary-text" />
                </Button>
              </AppToolbar>
              <Stack sx={{ px: 1.5 }}>
                <MailList scrollParent={`${uuid}-scrollable`} />
                <Stack direction="row" gap={2} sx={{ pl: 7, pr: 1, mb: 1.5 }}>
                  <Button variant="contained" color="secondary" startIcon={<ReplyIcon className="sm-icon" />}>
                    {$reply(t)}
                  </Button>
                  <Button variant="contained" color="secondary" startIcon={<ReplyAllIcon className="sm-icon" />}>
                    {$replyAll(t)}
                  </Button>
                  <Button variant="contained" color="secondary" startIcon={<ForwardIcon className="sm-icon" />}>
                    {$forward(t)}
                  </Button>
                </Stack>
              </Stack>
            </>
          ),
          ELSE(() => (
            <Stack justifyContent="center" alignItems="center" gap={1} className="flex-auto" sx={{ px: 1.5 }}>
              <Txt variant="h3" color="textDisabled" className="semibold text-center">
                {$noThreadSelectedTitle(t)}
              </Txt>
              <Txt variant="body1" color="textDisabled" className="semibold text-center">
                {$noThreadSelectedInstructions(t)}
              </Txt>
            </Stack>
          ))
        )}
      </Stack>
    </Stack>
  );
};
