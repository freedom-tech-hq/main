import type { IfExpression } from '../types/IfExpression.ts';

export interface NotExpression<T> {
  not: IfExpression<T>;
}

export const NOT = <T>(subexpression: IfExpression<T>): NotExpression<T> => ({ not: subexpression });

export const isNotExpression = (value: any): value is NotExpression<any> => value !== null && typeof value === 'object' && 'not' in value;
