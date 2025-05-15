import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { Uuid } from 'freedom-basic-data';
import { log } from 'freedom-contexts';
import type { LocallyStoredEncryptedEmailCredentialPasswordType } from 'freedom-email-tasks-web-worker';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useBinding, useCallbackRef } from 'react-bindings';
import type { TypeOrPromisedType } from 'yaschema';

import { useTasks } from '../../contexts/tasks.tsx';
import { getTaskWorkerConfig } from '../../task-worker-configs/configs.ts';
import { EmailField } from './fields/EmailField.tsx';
import { MasterPasswordField } from './fields/MasterPasswordField.tsx';

const ns = 'ui';
const $cancel = LOCALIZE('Cancel')({ ns });
const $login = LOCALIZE('Retrieve Credentials')({ ns });
const $loading = LOCALIZE('Loading...')({ ns });
const $loginFromServerInstructions = LOCALIZE('Enter your email and password to retrieve your credentials from the server.')({ ns });
const $signIn = LOCALIZE('Sign In')({ ns });

export interface LoginFromServerDialogProps {
  dismiss: () => void;
  onSubmit: (args: {
    localCredentialUuid: Uuid;
    description: string;
    password: string;
    passwordType: LocallyStoredEncryptedEmailCredentialPasswordType;
  }) => TypeOrPromisedType<void>;
}

export const LoginFromServerDialog = ({ dismiss, onSubmit }: LoginFromServerDialogProps) => {
  const t = useT();
  const tasks = useTasks();

  const emailUsername = useBinding(() => '', { id: 'emailUsername', detectChanges: true });
  const masterPassword = useBinding(() => '', { id: 'masterPassword', detectChanges: true });
  const isBusy = useBinding(() => false, { id: 'isBusy', detectChanges: true });

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    if (isBusy.get() || tasks === undefined) {
      return;
    }

    event.preventDefault();

    const theEmailUsername = emailUsername.get();
    const theMasterPassword = masterPassword.get();

    const email = `${theEmailUsername}@${getTaskWorkerConfig().defaultEmailDomain}`;

    isBusy.set(true);

    try {
      const imported = await tasks.importEmailCredentialFromRemote({ email });
      if (!imported.ok) {
        log().error?.('Failed to import email credential', imported.value);
        // TODO: UI
        return;
      }

      await onSubmit({
        localCredentialUuid: imported.value.locallyStoredCredentialUuid,
        description: email,
        password: theMasterPassword,
        passwordType: 'master'
      });
    } catch (error) {
      log().error?.('Error during server login', error);
    } finally {
      isBusy.set(false);
    }
  });

  return (
    <Dialog open={true} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
      <DialogTitle>{$signIn(t)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{$loginFromServerInstructions(t)}</DialogContentText>
        <EmailField autoFocus value={emailUsername} isBusy={isBusy} />
        <MasterPasswordField value={masterPassword} isBusy={isBusy} />
      </DialogContent>
      <DialogActions>
        <Button onClick={dismiss} disabled={isBusy.get()}>
          {$cancel(t)}
        </Button>
        <Button type="submit" disabled={isBusy.get()}>
          {isBusy.get() ? $loading(t) : $login(t)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
