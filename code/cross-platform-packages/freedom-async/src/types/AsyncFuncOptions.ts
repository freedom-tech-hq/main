import type { TypeOrPromisedType } from 'yaschema';

import type { FuncOptions } from './FuncOptions.ts';

export type AsyncFuncOptions<ReturnT> = FuncOptions<ReturnT, TypeOrPromisedType<void>>;
