import type { FocusControls } from 'freedom-web-focus';

export interface VirtualListControls<KeyT extends string> extends FocusControls {
  scrollToItemWithKey?: (key: KeyT) => void;
}
