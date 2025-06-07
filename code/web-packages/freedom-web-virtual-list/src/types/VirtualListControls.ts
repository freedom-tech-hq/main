import type { FocusControls } from 'freedom-web-focus';

export interface VirtualListControls<KeyT extends string> extends FocusControls {
  scrollToItemWithKey?: (key: KeyT, options?: { scrollAreaInsets?: { top?: number; bottom?: number } }) => void;
}
