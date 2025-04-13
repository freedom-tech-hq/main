import type { ReactNode } from 'react';

import type { ElseIfExpression } from '../types/ElseIfExpression.ts';
import type { IfExpression } from '../types/IfExpression.ts';

/** T can be a waitable, binding, `IfExpression`, `OrExpression`, `NotExpression` or any other value. */
export const ELSE_IF = <T>(expression: IfExpression<T> | Array<IfExpression<T>>, render: () => ReactNode): ElseIfExpression<T> => ({
  elseIf: expression,
  render
});
