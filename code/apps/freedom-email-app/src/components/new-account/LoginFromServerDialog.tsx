import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { Uuid } from 'freedom-basic-data';
import { log, makeTrace } from 'freedom-contexts';
import type { EmailUserId } from 'freedom-email-sync';
import type { EmailCredential } from 'freedom-email-user';
import { decryptEmailCredentialWithPassword } from 'freedom-email-user';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useState } from 'react';
import { useBinding, useCallbackRef } from 'react-bindings';

import { useTasks } from '../../contexts/tasks.tsx';
import { ControlledTextField } from '../form/ControlledTextField.tsx';

const ns = 'ui';
const $cancel = LOCALIZE('Cancel')({ ns });
const $login = LOCALIZE('Retrieve Credentials')({ ns });
const $email = LOCALIZE('Email')({ ns });
const $password = LOCALIZE('Password')({ ns });
const $loading = LOCALIZE('Loading...')({ ns });
const $loginFromServer = LOCALIZE('Login from Server')({ ns });
const $loginFromServerInstructions = LOCALIZE('Enter your email and password to retrieve your credentials from the server.')({ ns });

export interface LoginFromServerDialogProps {
  dismiss: () => void;
  onLogin: ({
    userId,
    locallyStoredCredentialUuid,
    decryptedCredentials
  }: {
    userId: EmailUserId;
    locallyStoredCredentialUuid: Uuid;
    decryptedCredentials: EmailCredential; // Prevent asking for password again
  }) => void;
}

export const LoginFromServerDialog = ({ dismiss, onLogin }: LoginFromServerDialogProps) => {
  const t = useT();
  const tasks = useTasks();

  const email = useBinding(() => '', { id: 'email', detectChanges: true });
  const password = useBinding(() => '', { id: 'password', detectChanges: true });
  const isLoading = useBinding(() => false, { id: 'isLoading', detectChanges: true });
  const [error, setError] = useState<string | undefined>(undefined);

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // TODO: design client validation

    const theEmail = email.get();
    const thePassword = password.get();

    if (isLoading.get() || !tasks) {
      return;
    }

    isLoading.set(true);
    setError(undefined);

    try {
      // TODO: Move where appropriate
      const trace = makeTrace(import.meta.filename, 'onLoginFromServer');

      // Retrieve encrypted credentials from the server
      const retrieveCredentialsResult = await tasks.retrieveCredentialsFromServer({ email: theEmail });
      if (!retrieveCredentialsResult.ok) {
        setError(`Failed to retrieve credentials: ${retrieveCredentialsResult.value.message}`);
        return;
      }

      const { encryptedCredentials } = retrieveCredentialsResult.value;

      if (encryptedCredentials === null) {
        setError('No credentials found for this email address');
        return;
      }

      // Import the retrieved credentials
      const imported = await tasks.importEmailCredential({
        description: `Imported - ${new Date().toISOString()}`,
        encryptedEmailCredential: encryptedCredentials
      });
      if (!imported.ok) {
        log().error?.('Failed to import email credential', imported.value);
        // TODO: UI
        return;
      }

      // Decrypt the credentials using the password
      const decryptResult = await decryptEmailCredentialWithPassword(trace, {
        encryptedEmailCredential: encryptedCredentials,
        password: thePassword
      });

      if (!decryptResult.ok) {
        setError(`Failed to decrypt credentials: ${decryptResult.value.message}`);
        return;
      }

      // Call onLogin callback with decrypted credentials
      onLogin({
        userId: retrieveCredentialsResult.value.userId,
        locallyStoredCredentialUuid: imported.value.locallyStoredCredentialUuid,
        decryptedCredentials: decryptResult.value
      });

      // Close the dialog
      dismiss();
    } catch (error) {
      log().error?.('Error during server login', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      isLoading.set(false);
    }
  });

  return (
    <Dialog open={true} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
      <DialogTitle>{$loginFromServer(t)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{$loginFromServerInstructions(t)}</DialogContentText>
        <ControlledTextField
          type="email"
          value={email}
          autoFocus
          required
          margin="dense"
          id="email"
          name="email"
          label={$email(t)}
          fullWidth
          variant="standard"
          onChange={(e) => {
            email.set(e.target.value);
          }}
        />
        <ControlledTextField
          type="password"
          value={password}
          required
          margin="dense"
          id="password"
          name="password"
          label={$password(t)}
          fullWidth
          variant="standard"
          autoComplete="current-password"
        />
        {error !== undefined && <DialogContentText color="error">{error}</DialogContentText>}
      </DialogContent>
      <DialogActions>
        <Button onClick={dismiss} disabled={isLoading.get()}>
          {$cancel(t)}
        </Button>
        <Button type="submit" disabled={isLoading.get()}>
          {isLoading.get() ? $loading(t) : $login(t)}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
