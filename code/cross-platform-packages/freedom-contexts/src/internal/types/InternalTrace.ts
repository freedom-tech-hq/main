import type { Trace } from '../../types/Trace.ts';

export interface InternalTrace extends Trace {
  idStack: string[];
  space: Record<string, any>;
  attached?: object;
}
