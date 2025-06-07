import type { Notifiable } from 'freedom-notification-types';

export type DataSourceLoadingSide = 'start' | 'end';
export type IsDataSourceLoading = [false, undefined?] | [true, DataSourceLoadingSide];

export type DataSourceNotifications = {
  /** Indices are relative to the array after the additions, so the same index shouldn't be used multiple times */
  itemsAdded: { indices: Readonly<number[]> };

  itemsCleared: Record<string, never>;

  /** Indices are processed in order.  Subsequent pairs may need to account for index shifts that result from prior moves */
  itemsMoved: { indices: Readonly<Array<[from: number, to: number]>> };

  /** Indices are relative to the array before the removals, so the same index shouldn't be used multiple times */
  itemsRemoved: { indices: Readonly<number[]> };

  itemsUpdated: { indices: Readonly<number[]> };

  loadingStateChanged: { isLoading: IsDataSourceLoading };
};

export interface DataSource<T, KeyT extends string> extends Notifiable<DataSourceNotifications> {
  readonly getIndexOfItemWithKey: (key: KeyT) => number;
  readonly getItemAtIndex: (index: number) => T;
  readonly getKeyForItemAtIndex: (index: number) => KeyT;
  readonly getNumItems: () => number;
  readonly isLoading: () => IsDataSourceLoading;
}
