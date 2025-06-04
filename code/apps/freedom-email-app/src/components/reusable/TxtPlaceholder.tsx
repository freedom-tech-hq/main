import type { TypographyProps } from '@mui/material';
import { Fragment } from 'react/jsx-runtime';

import { Txt } from './aliases/Txt.tsx';

export type TxtPlaceholderProps = TypographyProps;

export const TxtPlaceholder = ({ children, ...props }: TxtPlaceholderProps & { children?: string }) => {
  const parts = children?.split(/\s+/);

  return (
    <Txt variant="inherit" {...props} className={`TxtPlaceholder ${children === undefined ? 'empty' : ''} ${props.className ?? ''}`}>
      {parts?.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? <span className="space"> </span> : null}
          <span>{part}</span>
        </Fragment>
      )) ?? <>&nbsp;</>}
    </Txt>
  );
};
