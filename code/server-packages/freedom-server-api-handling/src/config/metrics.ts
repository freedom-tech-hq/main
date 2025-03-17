/* node:coverage disable */

import type { MetricsCollector } from 'freedom-metrics-types';

let globalMetricsCollector: MetricsCollector | undefined;

export const metricsCollector = () => globalMetricsCollector;

export const setMetricsCollector = (metricsCollector: MetricsCollector) => {
  globalMetricsCollector = metricsCollector;
};
