import type { IfExpression } from '../types/IfExpression.ts';

export interface OrExpression<T> {
  or: IfExpression<T>[];
}

export const OR = <T>(...subexpressions: IfExpression<T>[]): OrExpression<T> => ({ or: subexpressions });

export const isOrExpression = (value: any): value is OrExpression<any> => value !== null && typeof value === 'object' && 'or' in value;
