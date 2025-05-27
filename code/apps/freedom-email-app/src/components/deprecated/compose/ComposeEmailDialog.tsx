import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { parseAddressList } from 'email-addresses';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { flatten } from 'lodash-es';
import { BC, useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { useTasks } from '../../../contexts/tasks.tsx';
import { ControlledTextField } from '../../reusable/form/ControlledTextField.tsx';

const ns = 'ui';
const $body = LOCALIZE('Body')({ ns });
const $cancel = LOCALIZE('Cancel')({ ns });
const $newMessage = LOCALIZE('New Message')({ ns });
const $send = LOCALIZE('Send')({ ns });
const $subject = LOCALIZE('Subject')({ ns });
const $to = LOCALIZE('To')({ ns });

export interface ComposeEmailDialogProps {
  dismiss: () => void;
}

export const ComposeEmailDialog = ({ dismiss }: ComposeEmailDialogProps) => {
  const t = useT();
  const tasks = useTasks();

  const to = useBinding(() => '', { id: 'to', detectChanges: true });
  const subject = useBinding(() => '', { id: 'subject', detectChanges: true });
  const body = useBinding(() => '', { id: 'body', detectChanges: true });
  const isBusy = useBinding(() => false, { id: 'isBusy', detectChanges: true });

  const isReady = useDerivedWaitable({ to, subject }, ({ to, subject }) => to.length > 0 && subject.length > 0, {
    id: 'isReady',
    limitType: 'none'
  });

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    if (isBusy.get() || tasks === undefined) {
      return;
    }

    event.preventDefault();

    if (!(isReady.value.get() ?? false)) {
      return; // Not ready
    }

    isBusy.set(true);
    try {
      const parsedAddressList = parseAddressList(to.get()) ?? [];
      const toAddresses = flatten(
        parsedAddressList.map((address): string | string[] => {
          switch (address.type) {
            case 'group':
              return address.addresses.map(({ address }) => address);
            case 'mailbox':
              return address.address;
          }
        })
      );

      const sent = await tasks.sendMail({
        to: toAddresses,
        subject: subject.get(),
        body: body.get(),
        from: 'sender', // Filled in by server
        timeMSec: Date.now()
      });
      if (!sent.ok) {
        console.error('Failed to send email:', sent.value);
        return;
      }

      dismiss();
    } finally {
      isBusy.set(false);
    }
  });

  return (
    <Dialog open={true} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
      <DialogTitle>{$newMessage(t)}</DialogTitle>
      <DialogContent>
        {BC(isBusy, (isBusy) => (
          <ControlledTextField
            type="text"
            value={to}
            autoFocus
            required
            margin="dense"
            id="to"
            name="to"
            label={$to(t)}
            fullWidth
            variant="standard"
            helperText=" "
            disabled={isBusy}
          />
        ))}
        {BC(isBusy, (isBusy) => (
          <ControlledTextField
            type="text"
            value={subject}
            required
            margin="dense"
            id="subject"
            name="subject"
            label={$subject(t)}
            fullWidth
            helperText=" "
            variant="standard"
            disabled={isBusy}
          />
        ))}
        {BC(isBusy, (isBusy) => (
          <ControlledTextField
            type="text"
            multiline
            minRows={4}
            value={body}
            margin="dense"
            id="body"
            name="body"
            label={$body(t)}
            fullWidth
            variant="standard"
            helperText=" "
            disabled={isBusy}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={dismiss}>{$cancel(t)}</Button>
        {BC(isReady.value, (isReady = false) => (
          <Button disabled={!isReady} type="submit">
            {$send(t)}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};
