import { objectEntries } from './objectEntries.ts';

type ObjectEntryComparator<T extends Record<string, any>> = (
  a: [keyof T & string, T[keyof T & string]],
  b: [keyof T & string, T[keyof T & string]]
) => number;
const defaultComparator = <T extends Record<string, any>>(
  a: [keyof T & string, T[keyof T & string]],
  b: [keyof T & string, T[keyof T & string]]
) => (a[0] as string).localeCompare(b[0] as string);

export const objectWithSortedKeys = <T extends Record<string, any>>(obj: T, comparator: ObjectEntryComparator<T> = defaultComparator): T =>
  (objectEntries(obj) as Array<[keyof T & string, T[keyof T & string]]>).sort(comparator).reduce((out, [key, value]) => {
    out[key] = value;
    return out;
  }, {} as Partial<T>) as T;
