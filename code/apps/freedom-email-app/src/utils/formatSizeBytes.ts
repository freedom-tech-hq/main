import { ONE_GBYTE, ONE_MBYTE } from 'freedom-basic-data';

export const formatSizeBytes = (value: number) => {
  if (value > ONE_GBYTE) {
    return `${(value / ONE_GBYTE).toFixed(1)}GB`;
  } else {
    return `${(value / ONE_MBYTE).toFixed(1)}MB`;
  }
};
