export const doRangesIntersect = (range1: [number, number], range2: [number, number]): boolean => {
  const [start1, end1] = range1;
  const [start2, end2] = range2;

  return start1 < end2 && start2 < end1;
};
