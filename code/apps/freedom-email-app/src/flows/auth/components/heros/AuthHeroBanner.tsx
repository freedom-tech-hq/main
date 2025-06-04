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
      <Stack gap={4} className="primary-color-bg" sx={{ position: 'relative', borderRadius: 2, px: 2, py: 3 }}>
        <img src={Vector1} style={{ position: 'absolute', left: 0, top: 0 }} width="489px" />
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ zIndex: 1 }}>
          <CompanyLogoIcon className="primary-contrast" sx={{ width: '40px', height: '40px' }} />
          <Txt variant="h3" className="semibold primary-contrast">
            {$appName(t)}
          </Txt>
        </Stack>
        <Stack gap={2} sx={{ zIndex: 1 }}>
          <Txt variant="h1" className="primary-contrast" style={{ fontSize: '36px', fontWeight: 700 }}>
            {$headline(t)}
          </Txt>
          <Txt variant="h3" className="primary-contrast">
            {$detail(t)}
          </Txt>
        </Stack>
      </Stack>
    </Stack>
  );
};
