import type { nest } from '../utils/nest.ts';

export type Nested<A, B extends object> = ReturnType<typeof nest<A, B>>;
