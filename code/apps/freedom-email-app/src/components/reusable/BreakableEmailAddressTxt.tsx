import type { TypographyProps } from '@mui/material';
import type { HTMLAttributes } from 'react';

import { Txt } from './aliases/Txt.tsx';

export interface BreakableEmailAddressTxtProps extends TypographyProps {
  namePartProps?: HTMLAttributes<HTMLSpanElement>;
  domainPartProps?: HTMLAttributes<HTMLSpanElement>;
}

export const BreakableEmailAddressTxt = ({
  children: email,
  namePartProps,
  domainPartProps,
  ...props
}: { children: string } & BreakableEmailAddressTxtProps) => {
  let indexOfFirstAt = email.indexOf('@');
  if (indexOfFirstAt < 0) {
    indexOfFirstAt = email.length; // If no '@' found, use the full string
  }

  const [namePart, domainPart] = [email.substring(0, indexOfFirstAt), email.substring(indexOfFirstAt)];

  return (
    <Txt {...props}>
      <span {...namePartProps} style={{ wordBreak: 'break-all', ...namePartProps?.style }}>
        {namePart}
      </span>
      <span style={{ display: 'inline-block' }}>
        <span {...domainPartProps} style={{ wordBreak: 'break-all', ...domainPartProps?.style }}>
          {domainPart}
        </span>
      </span>
    </Txt>
  );
};
