/** Either an immediate value or a value that can be retrieved by calling a function */
export type TypeOrDeferredType<T> = T | (() => T);
