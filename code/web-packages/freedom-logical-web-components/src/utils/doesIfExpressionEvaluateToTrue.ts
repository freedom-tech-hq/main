import { resolveTypeOrBindingType } from 'react-bindings';
import { isWaitable } from 'react-waitables';

import type { AndExpression } from '../components/AND.ts';
import { isAndExpression } from '../components/AND.ts';
import type { NotExpression } from '../components/NOT.ts';
import { isNotExpression } from '../components/NOT.ts';
import type { OrExpression } from '../components/OR.ts';
import { isOrExpression } from '../components/OR.ts';
import type { IfExpression } from '../types/IfExpression.ts';

export const doesIfExpressionEvaluateToTrue = <T>(expression: IfExpression<T>): boolean => {
  if (isAndExpression(expression)) {
    return doesAndExpressionEvaluateToTrue(expression);
  } else if (isOrExpression(expression)) {
    return doesOrExpressionEvaluateToTrue(expression);
  } else if (isNotExpression(expression)) {
    return doesNotExpressionEvaluateToTrue(expression);
  }

  return Boolean(isWaitable(expression) ? expression.value.get() : resolveTypeOrBindingType(expression));
};

// Helpers

const doesAndExpressionEvaluateToTrue = <T>(expression: AndExpression<T>): boolean =>
  expression.and.find((subexpression) => !doesIfExpressionEvaluateToTrue(subexpression)) === undefined;

const doesOrExpressionEvaluateToTrue = <T>(expression: OrExpression<T>): boolean =>
  expression.or.find((subexpression) => doesIfExpressionEvaluateToTrue(subexpression)) !== undefined;

const doesNotExpressionEvaluateToTrue = <T>(expression: NotExpression<T>): boolean => !doesIfExpressionEvaluateToTrue(expression.not);
