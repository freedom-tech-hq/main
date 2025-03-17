import type { Notifiable } from 'freedom-notification-types';

export type DataSourceLoadingSide = 'start' | 'end';
export type IsDataSourceLoading = [false, undefined?] | [true, DataSourceLoadingSide];

export type DataSourceNotifications = {
  itemsAdded: { indices: number[] };
  itemsCleared: Record<string, never>;
  itemsRemoved: { indices: number[] };
  itemsUpdated: { indices: number[] };
  itemsMoved: { indices: Array<[from: number, to: number]> };
  loadingStateChanged: { isLoading: IsDataSourceLoading };
};

export interface DataSource<T, KeyT extends string> extends Notifiable<DataSourceNotifications> {
  readonly getIndexOfItemWithKey: (key: KeyT) => number;
  readonly getItemAtIndex: (index: number) => T;
  readonly getKeyForItemAtIndex: (index: number) => KeyT;
  readonly getNumItems: () => number;
  readonly isLoading: () => IsDataSourceLoading;
}
