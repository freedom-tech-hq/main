import { isEqual } from 'lodash-es';

/** Checks that the "after" array contains all of the elements from the "before" array, in the same relative order.
 *
 * @returns `undefined` if the "after" array does not contain all of the elements from the "before" array, in the same relative order.
 * Otherwise, returns the elements added to the "after" array.
 */
export const checkAfterArrayIncludesAllBeforeArrayElementsInSameRelativeOrder = <T>({
  before,
  after,
  isEqual: areValuesEqual = isEqual
}: {
  before: T[];
  after: T[];
  isEqual?: (a: any, b: any) => boolean;
}): T[] | undefined => {
  const addedElements: T[] = [];

  let afterIndex = 0;
  const numAfter = after.length;
  for (const beforeElement of before) {
    let found = false;
    for (; afterIndex < numAfter; afterIndex += 1) {
      const afterElement = after[afterIndex];
      if (areValuesEqual(beforeElement, afterElement)) {
        found = true;
        break;
      } else {
        addedElements.push(afterElement);
      }
    }

    if (!found) {
      return undefined;
    }
  }

  return addedElements;
};
