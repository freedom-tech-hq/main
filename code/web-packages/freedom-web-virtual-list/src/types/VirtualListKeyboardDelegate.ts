export interface VirtualListKeyboardDelegate {
  readonly onKeyDown?: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}
