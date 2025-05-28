import { Button, Stack, useTheme } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';
import { BC } from 'react-bindings';
import { useDerivedWaitable } from 'react-waitables';

import { Txt } from '../../../../components/reusable/aliases/Txt.tsx';
import { Divider } from '../../../../components/reusable/Divider.tsx';
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

export interface AuthSelectionProps {
  showLogo: boolean;
}

export const AuthSelection = ({ showLogo }: AuthSelectionProps) => {
  const t = useT();
  const theme = useTheme();
  const isMdOrLarger = useIsSizeClass('>=', 'md');

  const locallyStoredEncryptedEmailCredentials = useTaskWaitable((tasks) => tasks.listLocallyStoredEncryptedEmailCredentials(), {
    id: 'locallyStoredEncryptedEmailCredentials'
  });
  const hasAtLeastOneAccount = useDerivedWaitable(locallyStoredEncryptedEmailCredentials, (accounts) => accounts.length > 0, {
    id: 'hasAtLeastOneAccount'
  });

  return (
    <>
      {BC(isMdOrLarger, (isMdOrLarger) => (
        <Stack alignItems="center" justifyContent="center">
          <Stack
            alignItems="center"
            justifyContent="center"
            gap={isMdOrLarger ? 3 : 2}
            sx={{ maxWidth: `${theme.breakpoints.values.md}px` }}
          >
            {IF(showLogo, () => (
              <CompanyLogoIcon color="primary" className="lg-icon" />
            ))}

            <Stack alignItems="center" justifyContent="center" gap={2}>
              <Stack alignItems="center" justifyContent="center">
                <Txt variant="h2" className="semibold" textAlign="center">
                  {$welcome(t)}
                </Txt>
                {IF(hasAtLeastOneAccount, () => (
                  <Txt variant="body1" textAlign="center">
                    {$instructions(t)}
                  </Txt>
                ))}
              </Stack>

              <AccountList />
            </Stack>

            <Button variant="text" sx={{ alignSelf: 'stretch', gap: 1 }}>
              <UserRoundPlusIcon className="text-primary sm-icon" />
              {BC(hasAtLeastOneAccount.value, (hasAtLeastOneAccount) => (
                <Txt variant="button" className="medium text-primary" textTransform="none">
                  {(hasAtLeastOneAccount ?? false) ? $signInToAnotherAccount(t) : $signInToAccount(t)}
                </Txt>
              ))}
            </Button>

            <Divider label={$or(t)} />

            <Stack gap={2} sx={{ alignSelf: 'stretch' }}>
              <Button variant="contained" color="primary">
                <Txt variant="button" className="mediumim" textTransform="none">
                  {$createNewAccount(t)}
                </Txt>
              </Button>

              <Button variant="text" sx={{ gap: 1 }}>
                <ImportIcon className="text-primary sm-icon" />
                <Txt variant="button" className="medium text-primary" textTransform="none">
                  {$importCredential(t)}
                </Txt>
              </Button>
            </Stack>
          </Stack>
        </Stack>
      ))}
    </>
  );
};
