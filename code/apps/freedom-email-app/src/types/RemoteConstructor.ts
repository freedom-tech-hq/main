import type { Remote } from 'comlink';

export type RemoteConstructor<T> = new () => Promise<Remote<T>>;
