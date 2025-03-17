import type { FailureWithCode } from 'freedom-basic-data';

export interface FailableWithCodeHttpOutput<ErrorCodeT extends string> {
  failure: (status: number, value: Omit<FailureWithCode<ErrorCodeT>, 'status'>) => void;
}
