import { Fingerprint } from '@mui/icons-material';
import { Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Stack } from '@mui/material';
import { log } from 'freedom-async';
import type { Uuid } from 'freedom-basic-data';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import { useBinding, useCallbackRef } from 'react-bindings';
import { useEffect, useState } from 'react';
import type { TypeOrPromisedType } from 'yaschema';

import { authenticateWithWebAuthn, isWebAuthnAvailable } from '../../utils/webauthn.ts';
import { ControlledTextField } from '../form/ControlledTextField.tsx';

const ns = 'ui';
const $cancel = LOCALIZE('Cancel')({ ns });
const $unlockAccount = LOCALIZE('Unlock Account')({ ns });
const $masterPassword = LOCALIZE('Master Password')({ ns });
const $unlockAccountInstructions = LOCALIZE(
  'Your account information is protected with a master password. Enter it to unlock your account.'
)({ ns });
const $unlockWithBiometrics = LOCALIZE('Unlock with Biometrics')({ ns });
const $or = LOCALIZE('or')({ ns });
const $tryingBiometrics = LOCALIZE('Trying biometric authentication...')({ ns });

export interface UnlockAccountMasterPasswordDialogProps {
  localCredentialUuid: Uuid;
  dismiss: () => void;
  onSubmit: ({ localCredentialUuid, masterPassword }: { localCredentialUuid: Uuid; masterPassword: string }) => TypeOrPromisedType<void>;
}

export const UnlockAccountMasterPasswordDialog = ({ localCredentialUuid, dismiss, onSubmit }: UnlockAccountMasterPasswordDialogProps) => {
  const t = useT();
  const [webAuthnAvailable, setWebAuthnAvailable] = useState<boolean | null>(null);
  const [isTryingWebAuthn, setIsTryingWebAuthn] = useState(false);

  const masterPassword = useBinding(() => '', { id: 'masterPassword', detectChanges: true });

  // Check if WebAuthn is available in this browser
  useEffect(() => {
    const checkWebAuthn = async () => {
      const available = await isWebAuthnAvailable();
      setWebAuthnAvailable(available);
      
      // Try WebAuthn authentication immediately if available
      if (available) {
        tryWebAuthnAuthentication();
      }
    };
    
    checkWebAuthn();
  }, []);

  const tryWebAuthnAuthentication = async () => {
    if (!webAuthnAvailable) return;
    
    setIsTryingWebAuthn(true);
    try {
      const credential = await authenticateWithWebAuthn(localCredentialUuid);
      if (credential) {
        // If we got a credential, unlock the account with a special password
        // The actual implementation would generate a secure key here
        const webAuthnDerivedKey = `webauthn:${credential}`;
        onSubmit({ localCredentialUuid, masterPassword: webAuthnDerivedKey });
      }
    } catch (error) {
      log().error?.('WebAuthn authentication failed', error);
    } finally {
      setIsTryingWebAuthn(false);
    }
  };

  const wrappedOnSubmit = useCallbackRef(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const theMasterPassword = masterPassword.get();
    if (theMasterPassword.length === 0) {
      // TODO: show an error -- also better validation
      return;
    }

    onSubmit({ localCredentialUuid, masterPassword: theMasterPassword });
  });

  return (
    <Dialog open={true} onClose={dismiss} slotProps={{ paper: { component: 'form', onSubmit: wrappedOnSubmit } }}>
      <DialogTitle>{$unlockAccount(t)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{$unlockAccountInstructions(t)}</DialogContentText>
        
        {isTryingWebAuthn ? (
          <Stack direction="row" justifyContent="center" my={2}>
            <Chip
              icon={<Fingerprint />}
              label={$tryingBiometrics(t)}
              color="primary"
            />
          </Stack>
        ) : (
          webAuthnAvailable && (
            <>
              <Stack direction="row" justifyContent="center" my={2}>
                <Button 
                  variant="outlined" 
                  startIcon={<Fingerprint />} 
                  onClick={tryWebAuthnAuthentication}
                >
                  {$unlockWithBiometrics(t)}
                </Button>
              </Stack>
              
              <Stack direction="row" alignItems="center" my={2}>
                <Divider sx={{ flexGrow: 1 }} />
                <Chip label={$or(t)} size="small" sx={{ mx: 1 }} />
                <Divider sx={{ flexGrow: 1 }} />
              </Stack>
            </>
          )
        )}
        
        <ControlledTextField
          type="password"
          value={masterPassword}
          autoFocus={!webAuthnAvailable}
          autoComplete="password"
          required
          margin="dense"
          id="password"
          name="master-password"
          label={$masterPassword(t)}
          fullWidth
          variant="standard"
          disabled={isTryingWebAuthn}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={dismiss}>{$cancel(t)}</Button>
        <Button type="submit" disabled={isTryingWebAuthn}>{$unlockAccount(t)}</Button>
      </DialogActions>
    </Dialog>
  );
};
