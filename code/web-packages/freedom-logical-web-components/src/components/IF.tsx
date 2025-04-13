import type { ReactNode } from 'react';
import { BC } from 'react-bindings';

import type { ElseExpression } from '../types/ElseExpression.ts';
import type { ElseIfAndElseExpressions } from '../types/ElseIfAndElseExpressions.ts';
import { isElseIfExpression } from '../types/ElseIfExpression.ts';
import type { IfExpression } from '../types/IfExpression.ts';
import { doesIfExpressionEvaluateToTrue } from '../utils/doesIfExpressionEvaluateToTrue.ts';
import { extractBindingsFromIfExpression } from '../utils/extractBindingsFromIfExpression.ts';
import { AND } from './AND.ts';

/** T can be a waitable, binding, `IfExpression`, `OrExpression`, `NotExpression` or any other value. */
export const IF = <T,>(
  expression: IfExpression<T> | Array<IfExpression<T>>,
  render: () => ReactNode,
  ...elseIfAndElseExpressions: ElseIfAndElseExpressions
): ReactNode => (
  <>
    {Array.isArray(expression)
      ? IF(AND(...expression), render, ...elseIfAndElseExpressions)
      : BC(extractBindingsFromIfExpression(expression), () => {
          const isConditionSatisfied = doesIfExpressionEvaluateToTrue(expression);
          if (isConditionSatisfied) {
            return render();
          }

          if (elseIfAndElseExpressions.length === 0) {
            return null;
          }

          const next = elseIfAndElseExpressions[0];
          if (isElseIfExpression(next)) {
            const rest = elseIfAndElseExpressions.slice(1) as ElseIfAndElseExpressions;
            return IF(next.elseIf, next.render, ...rest);
          } else if (next !== undefined) {
            return (next as ElseExpression).else();
          } else {
            return null;
          }
        })}
  </>
);
