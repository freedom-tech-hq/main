import type { ElseExpression } from './ElseExpression.ts';
import type { ElseIfExpression } from './ElseIfExpression.ts';

export type ElseIfAndElseExpressions = Array<ElseIfExpression<any>> | [...Array<ElseIfExpression<any>>, ElseExpression | undefined];
