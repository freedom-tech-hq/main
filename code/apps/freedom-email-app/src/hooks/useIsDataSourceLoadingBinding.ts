import type { DataSource, IsDataSourceLoading } from 'freedom-data-source';
import { useEffect } from 'react';
import type { ReadonlyBinding } from 'react-bindings';
import { useBinding, useCallbackRef } from 'react-bindings';

export const useIsDataSourceLoadingBinding = (dataSource: DataSource<any, any>): ReadonlyBinding<boolean> => {
  const isDataSourceLoading = useBinding(() => dataSource.isLoading()[0], {
    id: 'isDataSourceLoading',
    detectChanges: true,
    deps: [dataSource]
  });

  const onLoadingStateChanged = useCallbackRef(({ isLoading }: { isLoading: IsDataSourceLoading }) => {
    isDataSourceLoading.set(isLoading[0]);
  });

  useEffect(() => dataSource.addListener('loadingStateChanged', onLoadingStateChanged));

  return isDataSourceLoading;
};
