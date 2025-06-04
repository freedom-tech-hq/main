import React from 'react';
import { Fragment } from 'react/jsx-runtime';

import type { TxtProps } from './aliases/Txt.ts';
import { Txt } from './aliases/Txt.ts';

export type TxtPlaceholderProps = TxtProps;

export const TxtPlaceholder = ({ children, ...props }: TxtPlaceholderProps & { children?: string }) => {
  const parts = children?.split(/\s+/);

  return (
    <Txt variant="inherit" {...props} className={`TxtPlaceholder ${children === undefined ? 'empty' : ''} ${props.className ?? ''}`}>
      {parts?.map((part, index) => (
        <Fragment key={index}>
          {index > 0 ? <span className="space"> </span> : null}
          <span>
            <span className="indicator" />
            {part}
          </span>
        </Fragment>
      )) ?? (
        <>
          <span className="indicator" />
          &nbsp;
        </>
      )}
    </Txt>
  );
};
