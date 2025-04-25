import { NotificationManager } from 'freedom-notification-types';
import { isEqual } from 'lodash-es';

import type { DataSource, DataSourceLoadingSide, DataSourceNotifications, IsDataSourceLoading } from './DataSource.ts';

/** The array associated with this data source is unowned by the data source.  Updated must be synchronously tracked using the
 * `item{Added,Moved,Removed,Updated}` methods */
export class ArrayDataSource<T, KeyT extends string> implements DataSource<T, KeyT> {
  private readonly getKeyForItemAtIndex_: (index: number) => KeyT;
  private readonly notificationManager_ = new NotificationManager<DataSourceNotifications>();
  private isLoading_: IsDataSourceLoading = [false];

  constructor(
    private readonly array: ArrayLike<T>,
    { getKeyForItemAtIndex }: { getKeyForItemAtIndex: (index: number) => KeyT }
  ) {
    this.getKeyForItemAtIndex_ = getKeyForItemAtIndex;
  }

  public addListener = <TypeT extends keyof DataSourceNotifications>(
    type: TypeT,
    callback: (args: DataSourceNotifications[TypeT]) => void
  ) => this.notificationManager_.addListener(type, callback);

  public getIndexOfItemWithKey(key: KeyT): number {
    const numItems = this.getNumItems();
    for (let itemIndex = 0; itemIndex < numItems; itemIndex += 1) {
      if (this.getKeyForItemAtIndex(itemIndex) === key) {
        return itemIndex;
      }
    }

    return -1;
  }

  public getItemAtIndex(index: number): T {
    return this.array[index];
  }

  public getKeyForItemAtIndex(index: number): KeyT {
    return this.getKeyForItemAtIndex_(index);
  }

  public getNumItems(): number {
    return this.array.length;
  }

  public isLoading(): IsDataSourceLoading {
    return this.isLoading_;
  }

  public itemsAdded({ indices }: { indices: number[] }) {
    this.notificationManager_.notify('itemsAdded', { indices });
  }

  public itemsCleared() {
    this.notificationManager_.notify('itemsCleared', {});
  }

  public itemsMoved({ indices }: { indices: Array<[from: number, to: number]> }) {
    this.notificationManager_.notify('itemsMoved', { indices });
  }

  public itemsRemoved({ indices }: { indices: number[] }) {
    this.notificationManager_.notify('itemsRemoved', { indices });
  }

  public itemsUpdated({ indices }: { indices: number[] }) {
    this.notificationManager_.notify('itemsUpdated', { indices });
  }

  public setIsLoading(isLoading: false | DataSourceLoadingSide) {
    const newIsLoading: IsDataSourceLoading = isLoading === false ? [false] : [true, isLoading];
    if (isEqual(newIsLoading, isLoading)) {
      return;
    }

    this.isLoading_ = newIsLoading;
    this.notificationManager_.notify('loadingStateChanged', { isLoading: newIsLoading });
  }
}
