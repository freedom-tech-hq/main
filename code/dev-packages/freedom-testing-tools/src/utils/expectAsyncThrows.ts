import assert from 'node:assert';

export const expectAsyncThrows = async (func: () => Promise<any>) => {
  let thrown: any;
  try {
    await func();
  } catch (e) {
    thrown = e;
  }

  assert.throws(() => {
    if (thrown !== undefined) {
      throw thrown;
    }
  });
};
