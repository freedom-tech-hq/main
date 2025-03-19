// eslint-disable-next-line import/no-unresolved
import { parse } from '@typescript-eslint/parser';

export const safeParse = (program: string): any => {
  try {
    return parse(program);
  } catch (e) {
    console.error(`Failed to parse: ${program}`, e);
    throw e;
  }
};
