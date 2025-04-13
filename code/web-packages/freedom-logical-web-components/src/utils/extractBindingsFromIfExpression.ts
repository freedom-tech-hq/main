import type { ReadonlyBinding } from 'react-bindings';
import { ifBinding } from 'react-bindings';
import { isWaitable } from 'react-waitables';

import type { AndExpression } from '../components/AND.ts';
import { isAndExpression } from '../components/AND.ts';
import type { NotExpression } from '../components/NOT.ts';
import { isNotExpression } from '../components/NOT.ts';
import type { OrExpression } from '../components/OR.ts';
import { isOrExpression } from '../components/OR.ts';
import type { IfExpression } from '../types/IfExpression.ts';

export const extractBindingsFromIfExpression = <T>(expression: IfExpression<T>): Array<ReadonlyBinding | undefined> => {
  if (isAndExpression(expression)) {
    return extractBindingsFromAndExpression(expression);
  } else if (isOrExpression(expression)) {
    return extractBindingsFromOrExpression(expression);
  } else if (isNotExpression(expression)) {
    return extractBindingsFromNotExpression(expression);
  }

  return [isWaitable(expression) ? expression.value : ifBinding(expression)];
};

// Helpers

const extractBindingsFromAndExpression = <T>(expression: AndExpression<T>) =>
  expression.and.reduce((out: Array<ReadonlyBinding | undefined>, subexpression) => {
    out.push(...extractBindingsFromIfExpression(subexpression));
    return out;
  }, []);

const extractBindingsFromOrExpression = <T>(expression: OrExpression<T>) =>
  expression.or.reduce((out: Array<ReadonlyBinding | undefined>, subexpression) => {
    out.push(...extractBindingsFromIfExpression(subexpression));
    return out;
  }, []);

const extractBindingsFromNotExpression = <T>(expression: NotExpression<T>) => extractBindingsFromIfExpression(expression.not);
