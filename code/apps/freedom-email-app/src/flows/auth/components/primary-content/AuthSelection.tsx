import { Button, List, ListItem, ListItemText, Stack, Typography, useTheme } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { IF } from 'freedom-logical-web-components';
import { useT } from 'freedom-react-localization';

import { Txt } from '../../../../components/reusable/aliases/Txt.tsx';
import { CompanyLogoIcon } from '../../../../icons/CompanyLogoIcon.ts';
import { UserRoundPlusIcon } from '../../../../icons/UserRoundPlusIcon.ts';

const ns = 'ui';
const $instructions = LOCALIZE('Choose an account to continue')({ ns });
const $signIn = LOCALIZE('Sign In')({ ns });
const $signInToAnotherAccount = LOCALIZE('Sign in to Another Account')({ ns });
const $welcome = LOCALIZE('Welcome to Freedom Mail!')({ ns });

const hasAtLeastOneAccount = Math.random() < 0.5;

export interface AuthSelectionProps {
  showLogo: boolean;
}

export const AuthSelection = ({ showLogo }: AuthSelectionProps) => {
  const t = useT();
  const theme = useTheme();

  return (
    <Stack alignItems="center" justifyContent="center" gap={2} sx={{ px: 2, py: 5 }}>
      {IF(showLogo, () => (
        <CompanyLogoIcon sx={{ color: 'var(--base-primary)', width: '40px', height: '40px' }} />
      ))}

      <Stack alignItems="center" justifyContent="center" gap={1}>
        <Txt variant="h2-semibold" textAlign="center">
          {$welcome(t)}
        </Txt>
        <Txt variant="p1-regular" textAlign="center">
          {$instructions(t)}
        </Txt>
      </Stack>

      {/* TODO: TEMP */}
      <List sx={{ alignSelf: 'stretch', px: 5 }}>
        <ListItem>
          <ListItemText primary="Hello World" />
        </ListItem>
      </List>

      <Button sx={{ gap: 1 }}>
        <UserRoundPlusIcon className="foreground" sx={{ width: '16px', height: '16px' }} />
        <Txt variant="button-medium" className="foreground" textTransform="none">
          {hasAtLeastOneAccount ? $signInToAnotherAccount(t) : $signIn(t)}
        </Txt>
      </Button>
    </Stack>
  );
};
