import type { ReactNode } from 'react';

import type { IfExpression } from './IfExpression.ts';

export type ElseIfExpression<T> = { elseIf: IfExpression<T> | Array<IfExpression<T>>; render: () => ReactNode };

export const isElseIfExpression = (value: any): value is ElseIfExpression<any> =>
  value !== null &&
  typeof value === 'object' &&
  'elseIf' in value &&
  'render' in value &&
  typeof (value as { render: any }).render === 'function';
