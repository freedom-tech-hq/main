import type { EncryptedValue } from './EncryptedValue.ts';

export type PlainOrEncryptedValue<T> = T | EncryptedValue<T>;
