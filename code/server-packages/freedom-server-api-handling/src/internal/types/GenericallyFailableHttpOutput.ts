import type { FailureWithCode } from 'freedom-basic-data';

export interface GenericallyFailableHttpOutput {
  failure: (status: number, value: Omit<FailureWithCode<'generic'>, 'status'>) => void;
}
