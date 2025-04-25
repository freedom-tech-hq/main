import type { ReadonlyBinding } from 'react-bindings';

import type { HistoryState } from './HistoryState.ts';
import type { HistoryStateOptions } from './HistoryStateOptions.ts';

export interface IHistory {
  stack: ReadonlyBinding<HistoryState[]>;
  canPop: ReadonlyBinding<boolean>;
  isEmpty: ReadonlyBinding<boolean>;
  top: ReadonlyBinding<HistoryState>;
  batch: (...steps: Array<() => void>) => void;
  clear: () => void;
  pop: () => void;
  push: (path: string, options?: HistoryStateOptions) => void;
  replace: (path: string, options?: HistoryStateOptions) => void;
}
