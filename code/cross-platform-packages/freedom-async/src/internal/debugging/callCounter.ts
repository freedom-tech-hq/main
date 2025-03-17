let globalCallCount = 0;
export const getCallCount = () => {
  globalCallCount += 1;
  return globalCallCount;
};
