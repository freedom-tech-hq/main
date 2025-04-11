import type { IfExpression } from '../types/IfExpression.ts';

export interface AndExpression<T> {
  and: IfExpression<T>[];
}

export const AND = <T>(...subexpressions: IfExpression<T>[]): AndExpression<T> => ({ and: subexpressions });

export const isAndExpression = (value: any): value is AndExpression<any> => value !== null && typeof value === 'object' && 'and' in value;
