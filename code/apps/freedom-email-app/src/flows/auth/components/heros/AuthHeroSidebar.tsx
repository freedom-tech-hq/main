import { Stack, useTheme } from '@mui/material';
import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';

import { Txt } from '../../../../components/reusable/aliases/Txt.tsx';
import { $appName } from '../../../../consts/common-strings.ts';
import { CompanyLogoIcon } from '../../../../icons/CompanyLogoIcon.ts';
import LockImage from './assets/Lock.svg';
import Vector1 from './assets/Vector1.svg';
import Vector2 from './assets/Vector2.svg';

const ns = 'ui';
const $headline = LOCALIZE('Reclaim Your Privacy')({ ns });
const $detail = LOCALIZE(
  "Freedom is creating technology that lets you own your data, protect your privacy, and break free from Big Tech's surveillance cloud."
)({ ns });

export const AuthHeroSidebar = () => {
  const t = useT();
  const theme = useTheme();

  return (
    <Stack sx={{ width: '50%', maxWidth: `${theme.breakpoints.values.lg}px`, p: 2 }}>
      <Stack
        justifyContent="space-between"
        className="primary-color-bg"
        sx={{
          position: 'relative',
          borderRadius: 2,
          flex: 1,
          p: 5,
          pb: 6,
          overflow: 'hidden'
        }}
      >
        <img src={Vector1} style={{ position: 'absolute', left: 0, top: 0 }} width="489px" />
        <img src={Vector2} style={{ position: 'absolute', bottom: 0, right: 0 }} width="677px" />
        <Stack direction="row" alignItems="center" gap={0.5} sx={{ zIndex: 1 }}>
          <CompanyLogoIcon className="primary-contrast" sx={{ width: '40px', height: '40px' }} />
          <Txt variant="h3" className="semibold primary-contrast">
            {$appName(t)}
          </Txt>
        </Stack>
        <Stack gap={3} sx={{ zIndex: 1 }}>
          <img src={LockImage} width="200px" />
          <Txt variant="h1" className="primary-contrast" style={{ fontSize: '72px', fontWeight: 700, lineHeight: '125%' }}>
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
