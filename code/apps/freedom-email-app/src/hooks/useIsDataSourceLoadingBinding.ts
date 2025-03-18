import { useEffect } from 'react';
import type { ReadonlyBinding } from 'react-bindings';
import { useBinding, useCallbackRef } from 'react-bindings';

import type { DataSource, IsDataSourceLoading } from '../types/DataSource.ts';

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
