export const objectValues = <T extends Record<string, any>>(obj: T) => Object.values(obj) as Array<T[keyof T]>;
