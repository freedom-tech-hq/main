import { demoHelper } from './demoHelper.ts';

/**
 * Creates a magic string with the provided inputs
 *
 * @param a - The first input string
 * @param b - The second input string
 * @returns The magic string
 */
export const demoMockingSubject = (a: string, b: string): string => {
  return `the-magic: ${a}, ${demoHelper(b)}`;
};
