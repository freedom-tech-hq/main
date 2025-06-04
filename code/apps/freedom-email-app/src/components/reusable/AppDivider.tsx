import { Stack } from '@mui/material';

import { Txt } from './aliases/Txt.tsx';

export interface AppDividerProps {
  label?: string;
}

export const AppDivider = ({ label }: AppDividerProps) => {
  if (label === undefined) {
    return <hr style={{ width: '100%' }} />;
  } else {
    return (
      <Stack alignItems="center" gap={2} direction="row" sx={{ width: '100%' }}>
        <hr style={{ flex: 1 }} />
        <Txt variant="body2" className="secondary-text">
          {label}
        </Txt>
        <hr style={{ flex: 1 }} />
      </Stack>
    );
  }
};
