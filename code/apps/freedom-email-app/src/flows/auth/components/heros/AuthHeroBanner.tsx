import { Stack } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';

import { Txt } from '../../../../components/reusable/aliases/Txt.tsx';
import { $appName } from '../../../../consts/common-strings.ts';
import { CompanyLogoIcon } from '../../../../icons/CompanyLogoIcon.ts';
import Vector1 from './assets/Vector1.svg';

const ns = 'ui';
const $headline = LOCALIZE('Reclaim Your Privacy')({ ns });
const $detail = LOCALIZE(
  "Freedom is creating technology that lets you own your data, protect your privacy, and break free from Big Tech's surveillance cloud."
)({ ns });

export const AuthHeroBanner = () => {
  const t = useT();

  return (
    <Stack sx={{ alignSelf: 'stretch', px: 2, py: 1.5 }}>
      <Stack gap={4} sx={{ position: 'relative', borderRadius: 2, backgroundColor: 'var(--base-primary)', px: 2, py: 3 }}>
        <img src={Vector1} style={{ position: 'absolute', left: 0, top: 0 }} width="489px" />
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ zIndex: 1 }}>
          <CompanyLogoIcon className="primary-foreground" sx={{ width: '40px', height: '40px' }} />
          <Txt variant="h3-semibold" className="primary-foreground">
            {$appName(t)}
          </Txt>
        </Stack>
        <Stack gap={2} sx={{ zIndex: 1 }}>
          <Txt variant="h1-accent-title" className="primary-foreground" style={{ fontSize: '36px', fontWeight: 700 }}>
            {$headline(t)}
          </Txt>
          <Txt variant="h3-regular" className="primary-foreground">
            {$detail(t)}
          </Txt>
        </Stack>
      </Stack>
    </Stack>
  );
};
