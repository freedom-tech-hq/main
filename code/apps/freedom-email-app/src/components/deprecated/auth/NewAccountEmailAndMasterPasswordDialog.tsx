import { CheckOutlined as AvailableIcon, EmailOutlined as EmailIcon, ErrorOutlineOutlined as UnavailableIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  useTheme
} from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { BC, useBinding, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable, WaitablesConsumer } from 'react-waitables';
import type { TypeOrPromisedType } from 'yaschema';

import { INPUT_DEBOUNCE_TIME_MSEC } from '../../../consts/timing.ts';
import { useTaskWaitable } from '../../../hooks/useTaskWaitable.ts';
import type { AppTheme } from '../../bootstrapping/AppTheme.tsx';
import { EmailField } from './fields/EmailField.tsx';
import { MasterPasswordField } from './fields/MasterPasswordField.tsx';

const ns = 'ui';
const $cancel = LOCALIZE('Cancel')({ ns });
const $createAccount = LOCALIZE('Create Account')({ ns });
const $emailUnavailable = LOCALIZE('Unavailable')({ ns });
const $invalidEmailUsername = LOCALIZE('Name not allowed')({ ns });
const $newAccount = LOCALIZE('New Account')({ ns });
const $newAccountInstructions = LOCALIZE(
  'To begin setting up your account, choose and email address and enter a new master password.  Consider using a password manager and a very complex password.'
)({ ns });
const $saveCredentials = LOCALIZE('Save encrypted credentials on our server')({ ns });
const $saveCredentialsHelp = LOCALIZE(
  'This will allow you to recover your account using your email and master password.  Your master password is never sent to our servers as all decryption occurs locally on your device.'
)({ ns });
const $dontSaveCredentialsHelp = LOCALIZE(
  'Your encrypted credentials will only be stored locally.  After creating your account, you will be prompted to download a recovery file, which you should retain.  Since the file is encrypted, this will still require your master password to regain access.'
)({ ns });

export interface NewAccountEmailAndMasterPasswordDialogProps {
  dismiss: () => void;
  onSubmit: ({
    emailUsername,
    masterPassword,
    saveCredentialsOnRemote
  }: {
    emailUsername: string;
    masterPassword: string;
    saveCredentialsOnRemote: boolean;
  }) => TypeOrPromisedType<void>;
}

export const NewAccountEmailAndMasterPasswordDialog = ({ dismiss, onSubmit }: NewAccountEmailAndMasterPasswordDialogProps) => {
  const t = useT();
  const theme = useTheme() as AppTheme;

  const emailUsername = useBinding(() => '', { id: 'emailUsername', detectChanges: true });
  const masterPassword = useBinding(() => '', { id: 'masterPassword', detectChanges: true });
  const saveCredentialsOnRemote = useBinding(() => true, { id: 'saveCredentialsOnRemote', detectChanges: true });
  const isBusy = useBinding(() => false, { id: 'isBusy', detectChanges: true });

  const checkedEmailAvailability = useTaskWaitable((tasks) => tasks.checkEmailAvailability({ emailUsername: emailUsername.get() }), {
    id: 'isEmailAddressAvailable',
    hardResetBindings: [emailUsername],
    limitMSec: INPUT_DEBOUNCE_TIME_MSEC
  });

  const emailError = useDerivedWaitable(
    checkedEmailAvailability,
    {
      ifLoaded: ({ available }) => (!available ? $emailUnavailable(t) : null),
      ifError: () =>
        emailUsername.get().length > 0 && checkedEmailAvailability.error.get() !== undefined ? $invalidEmailUsername(t) : null
    },
    { id: 'emailError' }
  );

  const isReady = useDerivedWaitable(
    { emailUsername, masterPassword, checkedEmailAvailability },
    ({ emailUsername, masterPassword, checkedEmailAvailability }) =>
      emailUsername.length > 0 && masterPassword.length > 0 && checkedEmailAvailability.available,
    { id: 'isReady', limitType: 'none' }
  );

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    if (isBusy.get()) {
      return;
    }

    event.preventDefault();

    if (!(isReady.value.get() ?? false)) {
      return; // Not ready
    }

    isBusy.set(true);
    try {
      await onSubmit({
        emailUsername: emailUsername.get(),
        masterPassword: masterPassword.get(),
        saveCredentialsOnRemote: saveCredentialsOnRemote.get()
      });
    } finally {
      isBusy.set(false);
    }
  });

  return (
    <Dialog open={true} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
      <DialogTitle>{$newAccount(t)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{$newAccountInstructions(t)}</DialogContentText>
        <EmailField
          autoFocus
          value={emailUsername}
          isBusy={isBusy}
          error={emailError}
          startAdornment={
            <Box sx={{ width: '24px', height: '24px', mr: 0.5 }}>
              <WaitablesConsumer dependencies={{ checkedEmailAvailability, emailUsername }}>
                {{
                  ifLoaded: ({ checkedEmailAvailability: { available } }) =>
                    available ? <AvailableIcon color="success" /> : <UnavailableIcon color="error" />,
                  ifLoading: ({ emailUsername }) =>
                    emailUsername.length === 0 ? (
                      <EmailIcon />
                    ) : (
                      <CircularProgress size={16} sx={{ m: '4px', color: theme.palette.text.disabled }} variant="indeterminate" />
                    ),
                  ifError: () => <EmailIcon />
                }}
              </WaitablesConsumer>
            </Box>
          }
        />
        <MasterPasswordField value={masterPassword} isBusy={isBusy} />
        {/* TODO: make controlled checkbox */}
        {BC(saveCredentialsOnRemote, (saveCredentialsOnRemote, binding) => (
          <>
            <FormControlLabel
              control={
                <Checkbox checked={saveCredentialsOnRemote} onChange={(event) => binding.set(event.target.checked)} color="primary" />
              }
              label={$saveCredentials(t)}
            />
            <DialogContentText variant="caption" sx={{ mt: 1, ml: 4 }}>
              {saveCredentialsOnRemote ? $saveCredentialsHelp(t) : $dontSaveCredentialsHelp(t)}
            </DialogContentText>
          </>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={dismiss}>{$cancel(t)}</Button>
        {BC(isReady.value, (isReady = false) => (
          <Button disabled={!isReady} type="submit">
            {$createAccount(t)}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};
