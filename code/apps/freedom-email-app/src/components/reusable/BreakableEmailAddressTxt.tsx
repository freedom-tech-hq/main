import type { HTMLAttributes } from 'react';
import React from 'react';

import type { TxtProps } from './aliases/Txt.ts';
import { Txt } from './aliases/Txt.ts';

export interface BreakableEmailAddressTxtProps extends TxtProps {
  namePartProps?: HTMLAttributes<HTMLSpanElement>;
  domainPartProps?: HTMLAttributes<HTMLSpanElement>;
  breakAnywhere?: boolean;
}

export const BreakableEmailAddressTxt = ({
  children: email,
  namePartProps,
  domainPartProps,
  breakAnywhere = false,
  ...props
}: { children: string } & BreakableEmailAddressTxtProps) => {
  let indexOfFirstAt = email.indexOf('@');
  if (indexOfFirstAt < 0) {
    indexOfFirstAt = email.length; // If no '@' found, use the full string
  }

  const [namePart, domainPart] = [email.substring(0, indexOfFirstAt), email.substring(indexOfFirstAt)];

  return (
    <Txt variant="inherit" {...props}>
      <span {...namePartProps} style={{ wordBreak: breakAnywhere ? 'break-all' : undefined, ...namePartProps?.style }}>
        {namePart}
      </span>
      <span style={{ display: 'inline-block' }}>
        <span {...domainPartProps} style={{ wordBreak: breakAnywhere ? 'break-all' : undefined, ...domainPartProps?.style }}>
          {domainPart}
        </span>
      </span>
    </Txt>
  );
};
