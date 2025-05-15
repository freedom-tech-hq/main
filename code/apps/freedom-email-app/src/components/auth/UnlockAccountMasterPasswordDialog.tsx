import { Fingerprint } from '@mui/icons-material';
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Stack } from '@mui/material';
import { makeSuccess } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { log, makeTrace } from 'freedom-contexts';
import type {
  LocallyStoredEncryptedEmailCredentialInfo,
  LocallyStoredEncryptedEmailCredentialPasswordType
} from 'freedom-email-tasks-web-worker';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { BC, useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';
import { useWaitableFunction } from 'react-waitables';
import type { TypeOrPromisedType } from 'yaschema';

import { authenticateWithWebAuthn } from '../../utils/webauthn/authenticateWithWebAuthn.ts';
import { isWebAuthnAvailable as checkIsWebAuthnAvailable } from '../../utils/webauthn/isWebAuthnAvailable.ts';
import { MasterPasswordField } from './fields/MasterPasswordField.tsx';

const ns = 'ui';
const $cancel = LOCALIZE('Cancel')({ ns });
const $unlockAccount = LOCALIZE('Unlock Account')({ ns });
const $unlockAccountInstructions = LOCALIZE(
  'Your account information is protected with a master password.  Enter it to unlock your account.'
)({ ns });
const $unlockWithBiometrics = LOCALIZE('Unlock with Biometrics')({ ns });
const $or = LOCALIZE('or')({ ns });

export interface UnlockAccountMasterPasswordDialogProps {
  credentialInfo: LocallyStoredEncryptedEmailCredentialInfo;
  dismiss: () => void;
  onSubmit: (args: {
    localCredentialUuid: Uuid;
    description: string;
    password: string;
    passwordType: LocallyStoredEncryptedEmailCredentialPasswordType;
  }) => TypeOrPromisedType<void>;
}

export const UnlockAccountMasterPasswordDialog = ({ credentialInfo, dismiss, onSubmit }: UnlockAccountMasterPasswordDialogProps) => {
  const t = useT();

  const isBusy = useBinding<boolean>(() => false, { id: 'isBusy', detectChanges: true });

  const masterPassword = useBinding(() => '', { id: 'masterPassword', detectChanges: true });

  const isWebAuthnAvailable = useWaitableFunction(async () => makeSuccess(await checkIsWebAuthnAvailable()), { id: 'isWebAuthnAvailable' });

  const tryWebAuthnAuthentication = useCallbackRef(async () => {
    if (isBusy.get()) {
      return;
    }

    if (window.PublicKeyCredential === undefined || isWebAuthnAvailable.value.get() !== true || !credentialInfo.hasBiometricEncryption) {
      return;
    }

    isBusy.set(true);
    try {
      const trace = makeTrace(import.meta.filename, 'tryWebAuthnAuthentication');
      const password = await authenticateWithWebAuthn(trace, credentialInfo.localUuid);
      if (!password.ok) {
        log().error?.('WebAuthn authentication failed', password.value);
        return;
      }

      await onSubmit({
        localCredentialUuid: credentialInfo.localUuid,
        description: credentialInfo.description,
        password: password.value,
        passwordType: 'biometrics'
      });
    } finally {
      isBusy.set(false);
    }
  });

  useBindingEffect(isWebAuthnAvailable.value, () => tryWebAuthnAuthentication(), { triggerOnMount: true });

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isBusy.get()) {
      return;
    }

    const theMasterPassword = masterPassword.get();
    if (theMasterPassword.length === 0) {
      // TODO: show an error -- also better validation
      return;
    }

    isBusy.set(true);
    try {
      await onSubmit({
        localCredentialUuid: credentialInfo.localUuid,
        description: credentialInfo.description,
        password: theMasterPassword,
        passwordType: 'master'
      });
    } finally {
      isBusy.set(false);
    }
  });

  return (
    <Dialog open={true} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
      <DialogTitle>{$unlockAccount(t)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{$unlockAccountInstructions(t)}</DialogContentText>

        {IF([credentialInfo.hasBiometricEncryption, isWebAuthnAvailable.value], () => (
          <>
            <Stack direction="row" justifyContent="center" my={2}>
              <Button variant="outlined" startIcon={<Fingerprint />} onClick={tryWebAuthnAuthentication}>
                {$unlockWithBiometrics(t)}
              </Button>
            </Stack>

            <Stack direction="row" alignItems="center" my={2}>
              <Divider sx={{ flexGrow: 1 }} />
              <Chip label={$or(t)} size="small" sx={{ mx: 1 }} />
              <Divider sx={{ flexGrow: 1 }} />
            </Stack>
          </>
        ))}

        <MasterPasswordField autoFocus value={masterPassword} isBusy={isBusy} />
      </DialogContent>
      <DialogActions>
        <Button onClick={dismiss}>{$cancel(t)}</Button>
        {BC(isBusy, (isBusy) => (
          <Button type="submit" disabled={isBusy}>
            {$unlockAccount(t)}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  );
};
