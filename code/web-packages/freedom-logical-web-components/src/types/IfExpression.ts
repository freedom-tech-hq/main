import type { ReadonlyBinding } from 'react-bindings';
import type { Waitable } from 'react-waitables';

import type { AndExpression } from '../components/AND.ts';
import type { NotExpression } from '../components/NOT.ts';
import type { OrExpression } from '../components/OR.ts';

export type IfExpression<T> = T | Waitable<T> | ReadonlyBinding<T> | AndExpression<T> | OrExpression<T> | NotExpression<T>;
