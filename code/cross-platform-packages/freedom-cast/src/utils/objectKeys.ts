export const objectKeys = <T extends Record<string, any>>(obj: T) => Object.keys(obj) as Array<keyof T>;
