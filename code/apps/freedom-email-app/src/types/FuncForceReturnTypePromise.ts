export type FuncForceReturnTypePromise<T> = T extends (...args: infer ArgT) => infer R ? (...args: ArgT) => Promise<Awaited<R>> : never;
