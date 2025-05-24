export interface VirtualListThemePalette {
  list: Record<
    'focused' | 'unfocused',
    {
      listItem: Record<
        'selected' | 'unselected',
        {
          backgroundColor: string;
          iconColor: string;
          color: string;
        }
      >;
    }
  >;
}

export interface VirtualListTheme {
  uid: string;
  palette: VirtualListThemePalette;
}
