import type { FocusControls } from '../../../types/FocusControls.ts';

export interface VirtualListControls<KeyT extends string> extends FocusControls {
  scrollToItemWithKey?: (key: KeyT) => void;
}
