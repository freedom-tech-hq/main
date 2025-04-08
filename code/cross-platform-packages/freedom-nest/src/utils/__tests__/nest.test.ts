import { describe, it } from 'node:test';

import { expectStrictEqual } from 'freedom-testing-tools';

import { nest } from '../nest.ts';

describe('nest', () => {
  it('should work with direct values', () => {
    const values = nest('a', { b: 'b', c: nest('c', { d: 'd' }) });
    expectStrictEqual(values.value, 'a');
    expectStrictEqual(values.b, 'b');
    expectStrictEqual(values.c.value, 'c');
    expectStrictEqual(values.c.d, 'd');
  });

  it('should work with sync functions', async () => {
    const paths = nest(3.14, (parent) => ({
      somethingElse: `${parent}/something-else`,
      deeper: nest(`${parent}/deeper`, (parent) => ({
        more: `${parent}/more`,
        withArgs: (name: string) => `${parent}/whoami/${name}`
      }))
    }));
    expectStrictEqual(paths.value, 3.14);
    expectStrictEqual(paths.somethingElse, '3.14/something-else');
    expectStrictEqual(paths.deeper.value, '3.14/deeper');
    expectStrictEqual(paths.deeper.more, '3.14/deeper/more');
    expectStrictEqual(paths.deeper.withArgs('tester'), '3.14/deeper/whoami/tester');
  });

  it('should work with sync functions and extra forward args', async () => {
    const paths = nest(
      [{ fwd: 'hello-world' }],
      (_args) => 3.14,
      (parent, { fwd }) => ({
        somethingElse: `${parent}/something-else/${fwd}`,
        deeper: nest(
          [{ a: 6.28, b: 'tester' }],
          (_args) => `${parent}/deeper`,
          (parent, { a, b }) => ({
            more: `${parent}/more/${a}+${b}`,
            withArgs: (name: string) => `${parent}/whoami/${name}`
          })
        )
      })
    );
    expectStrictEqual(paths.value, 3.14);
    expectStrictEqual(paths.somethingElse, '3.14/something-else/hello-world');
    expectStrictEqual(paths.deeper.value, '3.14/deeper');
    expectStrictEqual(paths.deeper.more, '3.14/deeper/more/6.28+tester');
    expectStrictEqual(paths.deeper.withArgs('tester'), '3.14/deeper/whoami/tester');
  });

  it('should work with async functions', async () => {
    const paths = await nest(3.14, async (parent) => ({
      somethingElse: `${parent}/something-else`,
      deeper: await nest(`${parent}/deeper`, async (parent) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          more: `${parent}/more`,
          withArgs: (name: string) => `${parent}/whoami/${name}`
        };
      })
    }));
    expectStrictEqual(paths.value, 3.14);
    expectStrictEqual(paths.somethingElse, '3.14/something-else');
    expectStrictEqual(paths.deeper.value, '3.14/deeper');
    expectStrictEqual(paths.deeper.more, '3.14/deeper/more');
    expectStrictEqual(paths.deeper.withArgs('tester'), '3.14/deeper/whoami/tester');
  });

  it('should work with async functions and extra forwarded args', async () => {
    const paths = await nest(
      [{ fwd: 'hello-world' }],
      (_args) => 3.14,
      async (parent, { fwd }) => ({
        somethingElse: `${parent}/something-else/${fwd}`,
        deeper: await nest(
          [{ a: 6.28, b: 'tester' }],
          (_args) => `${parent}/deeper`,
          async (parent, { a, b }) => {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return {
              more: `${parent}/more/${a}+${b}`,
              withArgs: (name: string) => `${parent}/whoami/${name}`
            };
          }
        )
      })
    );
    expectStrictEqual(paths.value, 3.14);
    expectStrictEqual(paths.somethingElse, '3.14/something-else/hello-world');
    expectStrictEqual(paths.deeper.value, '3.14/deeper');
    expectStrictEqual(paths.deeper.more, '3.14/deeper/more/6.28+tester');
    expectStrictEqual(paths.deeper.withArgs('tester'), '3.14/deeper/whoami/tester');
  });
});
