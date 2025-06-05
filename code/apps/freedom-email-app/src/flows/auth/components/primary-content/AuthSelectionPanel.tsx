import { Button, Collapse, Stack, useTheme } from '@mui/material';
import { log, makeTrace, makeUuid } from 'freedom-contexts';
import { encryptedEmailCredentialSchema } from 'freedom-email-sync';
import type { LocallyStoredEncryptedEmailCredentialInfo } from 'freedom-email-tasks-web-worker';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { parse } from 'freedom-serialization';
import { SLOW_ANIMATION_DURATION_MSEC } from 'freedom-web-animation';
import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { BC, useCallbackRef } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.ts';
import { AppDivider } from '../../../../components/reusable/AppDivider.tsx';
import { appRoot } from '../../../../components/routing/appRoot.tsx';
import { useTasks } from '../../../../contexts/tasks.tsx';
import { useIsSizeClass } from '../../../../hooks/useIsSizeClass.ts';
import { useTaskWaitable } from '../../../../hooks/useTaskWaitable.ts';
import { CompanyLogoIcon } from '../../../../icons/CompanyLogoIcon.ts';
import { ImportIcon } from '../../../../icons/ImportIcon.ts';
import { UserRoundPlusIcon } from '../../../../icons/UserRoundPlusIcon.ts';
import { AccountList } from '../secondary-content/AccountList.tsx';

const ns = 'ui';
const $createNewAccount = LOCALIZE('Create New Account')({ ns });
const $importCredential = LOCALIZE('Import Credential')({ ns });
const $instructions = LOCALIZE('Choose an account to continue')({ ns });
const $or = LOCALIZE('or')({ ns });
const $signInToAccount = LOCALIZE('Sign in to Account')({ ns });
const $signInToAnotherAccount = LOCALIZE('Sign in to Another Account')({ ns });
const $welcome = LOCALIZE('Welcome to Freedom Mail!')({ ns });

export const AuthSelectionPanel = () => {
  const history = useHistory();
  const t = useT();
  const tasks = useTasks();
  const theme = useTheme();
  const isMdOrLarger = useIsSizeClass('>=', 'md');
  const isLgOrLarger = useIsSizeClass('>=', 'lg');
  const uuid = React.useMemo(() => makeUuid(), []);

  const locallyStoredEncryptedEmailCredentials = useTaskWaitable((tasks) => tasks.listLocallyStoredEncryptedEmailCredentials(), {
    id: 'locallyStoredEncryptedEmailCredentials'
  });
  const hasAtLeastOneAccount = useDerivedWaitable(locallyStoredEncryptedEmailCredentials, (accounts) => accounts.length > 0, {
    id: 'hasAtLeastOneAccount'
  });

  const onAccountClick = useCallbackRef((account: LocallyStoredEncryptedEmailCredentialInfo) => {
    history.replace(appRoot.path.signIn(account.email));
  });

  const onCreateNewAccountClick = useCallbackRef(() => {
    history.replace(appRoot.path.newAccount);
  });

  const onImportCredentialClick = useCallbackRef(() => {
    const elem = document.getElementById(`${uuid}-credential-file-input`);
    if (elem === null) {
      return;
    }

    elem.click();
  });

  const onSignInWithRemoteClick = useCallbackRef(() => {
    history.replace(appRoot.path.addAccount);
  });

  const onCredentialFileChange = useCallbackRef(() => {
    if (tasks === undefined) {
      return; // Not ready
    }

    const elem = document.getElementById(`${uuid}-credential-file-input`);
    if (elem === null) {
      return; // Not ready
    }

    const input = elem as HTMLInputElement;
    if (input.files === null || input.files.length === 0) {
      return; // Nothing selected
    }

    const firstFile = input.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const jsonString = e.target?.result;
      if (typeof jsonString !== 'string') {
        return;
      }

      const encryptedCredential = await parse(
        makeTrace(import.meta.filename, 'onCredentialFileChange'),
        jsonString,
        encryptedEmailCredentialSchema
      );
      if (!encryptedCredential.ok) {
        log().error?.('Failed to parse email credential file', encryptedCredential.value);
        return;
      }

      const imported = await tasks.importEmailCredential({ encryptedCredential: encryptedCredential.value });
      if (!imported.ok) {
        log().error?.('Failed to import email credential', imported.value);
        return;
      }

      const locallyStoredEncryptedEmailCredentials = await tasks.listLocallyStoredEncryptedEmailCredentials();
      if (!locallyStoredEncryptedEmailCredentials.ok) {
        log().error?.('Failed to read local email credential', locallyStoredEncryptedEmailCredentials.value);
        return;
      }

      const importedAccount = locallyStoredEncryptedEmailCredentials.value.find(
        (cred) => cred.locallyStoredCredentialId === imported.value.locallyStoredCredentialId
      );
      if (importedAccount === undefined) {
        log().error?.('Failed to import email credential');
        return;
      }

      history.replace(appRoot.path.importCredential(importedAccount.email));
    };
    reader.readAsText(firstFile);
  });

  return BC({ isMdOrLarger, isLgOrLarger }, ({ isMdOrLarger, isLgOrLarger }) => (
    <Stack alignItems="center" justifyContent="center" sx={{ px: isLgOrLarger ? 3 : 2, py: 5 }}>
      <input
        id={`${uuid}-credential-file-input`}
        type="file"
        accept=".credential"
        onChange={onCredentialFileChange}
        style={{ display: 'none' }}
      />

      <Stack
        alignItems="center"
        justifyContent="center"
        gap={isMdOrLarger ? 3 : 2}
        sx={{ width: '100%', maxWidth: `${theme.breakpoints.values.md}px` }}
      >
        {IF(!isMdOrLarger, () => (
          <CompanyLogoIcon color="primary" className="lg-icon" />
        ))}

        <Stack alignItems="center" gap={2}>
          <Stack alignItems="center">
            <Txt variant="h2" className="semibold" textAlign="center">
              {$welcome(t)}
            </Txt>
            {BC(
              { isLoaded: locallyStoredEncryptedEmailCredentials.isComplete, hasAtLeastOneAccount: hasAtLeastOneAccount.value },
              ({ isLoaded, hasAtLeastOneAccount = false }) => (
                <Collapse in={isLoaded && hasAtLeastOneAccount} timeout={SLOW_ANIMATION_DURATION_MSEC}>
                  <Txt variant="body1" textAlign="center">
                    {$instructions(t)}
                  </Txt>
                </Collapse>
              )
            )}
          </Stack>

          {BC(
            { isLoaded: locallyStoredEncryptedEmailCredentials.isComplete, hasAtLeastOneAccount: hasAtLeastOneAccount.value },
            ({ isLoaded, hasAtLeastOneAccount = false }) => (
              <Collapse in={isLoaded && hasAtLeastOneAccount} timeout={SLOW_ANIMATION_DURATION_MSEC}>
                <AccountList onAccountClick={onAccountClick} />
              </Collapse>
            )
          )}
        </Stack>

        {BC({ isLoaded: locallyStoredEncryptedEmailCredentials.isComplete }, ({ isLoaded }) => (
          <Collapse in={isLoaded} timeout={SLOW_ANIMATION_DURATION_MSEC} sx={{ alignSelf: 'stretch' }}>
            <Stack alignItems="stretch" gap={isMdOrLarger ? 3 : 2}>
              <Button
                variant="text"
                className="default-text"
                startIcon={<UserRoundPlusIcon className="default-text sm-icon" />}
                onClick={onSignInWithRemoteClick}
              >
                {BC(hasAtLeastOneAccount.value, (hasAtLeastOneAccount) =>
                  (hasAtLeastOneAccount ?? false) ? $signInToAnotherAccount(t) : $signInToAccount(t)
                )}
              </Button>

              <AppDivider label={$or(t)} />

              <Stack gap={2}>
                <Button variant="contained" color="primary" onClick={onCreateNewAccountClick}>
                  {$createNewAccount(t)}
                </Button>

                <Button
                  variant="text"
                  className="default-text"
                  onClick={onImportCredentialClick}
                  startIcon={<ImportIcon className="default-text sm-icon" />}
                  disabled={tasks === undefined}
                >
                  {$importCredential(t)}
                </Button>
              </Stack>
            </Stack>
          </Collapse>
        ))}
      </Stack>
    </Stack>
  ));
};
