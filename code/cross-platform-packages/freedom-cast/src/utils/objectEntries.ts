export const objectEntries = <T extends Record<string, any>>(obj: T) => Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
