import type { Trace } from 'freedom-contexts';
import { createTraceContext, useTraceContext } from 'freedom-contexts';
import { type DataSources, InMemoryDataSources } from 'freedom-data-source-types';

const DataSourcesContext = createTraceContext<DataSources>(() => new InMemoryDataSources());

export const useDataSources = (trace: Trace) => useTraceContext(trace, DataSourcesContext);

export const dataSourcesProvider = <ReturnT>(trace: Trace, dataSources: DataSources, callback: (trace: Trace) => ReturnT) =>
  DataSourcesContext.provider(trace, dataSources, callback);
