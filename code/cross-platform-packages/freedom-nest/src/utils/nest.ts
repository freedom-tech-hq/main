import isPromise from 'is-promise';

type TypeOrPromisedType<T> = T | Promise<T>;

/**
 * Creates a structure by combining `a` and `b` such that `a` is accessed through a `value` field and the fields of `b` are directly added.
 *
 * For example: `nest('root', { deeper: nest('deeper', { deepest: 'deepest' }) })`
 *
 * results in a structure like:
 *
 * ```typescript
 * {
 *     value: string;
 *     deeper: {
 *         value: string;
 *         deepest: string;
 *     };
 * }
 * ```
 *
 * ```typescript
 * const values = nest('root', { deeper: nest('deeper', { deepest: 'deepest' }) });
 * console.log(values.value); // root
 * console.log(values.deeper.value); // deeper
 * console.log(values.deeper.deepest); // deepest
 * ```
 *
 * `b` can also be generated by a function that takes the value of `a` as its first argument.  This function can be sync or async.  If it's
 * async, the result of `nest` will be a promise.
 *
 * One may also optionally provide forwarding arguments and then both `a` and `b` can be generated by functions where the `a` generating
 * function gets the forwarded arguments directly and the `b` generating function gets the forwarded arguments after the value of `a`.
 * Either of these functions can be sync or async and if either are async, the result of `nest` will be a promise.
 *
 * If `b` is a function, it will be called with `a` as the first argument and the return value will be used as the entries.  If `b` is an
 * async function, the result of `nest` will be a promise.
 *
 * #### Example using b generated by a function:
 *
 * ```typescript
 * const paths = nest('root', (parent) => ({
 *   deeper: nest(`${parent}/deeper`, (parent) => ({
 *     deepest: `${parent}/deepest`
 *   }))
 * }));
 * console.log(paths.value); // root
 * console.log(paths.deeper.value); // root/deeper
 * console.log(paths.deeper.deepest); // root/deeper/deepest
 * ```
 *
 * #### Example using a and b generated by functions, with forwarding arguments:
 *
 * ```typescript
 * const titlesById = {
 *   root: 'Root',
 *   deeper: 'Deeper',
 *   deepest: 'Deepest'
 * };
 * const ids = nest('root' as const, { deeper: nest('deeper' as const, { deepest: 'deepest' as const }) });
 * const paths = nest(
 *   [ids.value],
 *   (id) => id,
 *   (parentPath, parentId) => ({
 *     _title: titlesById[parentId],
 *     deeper: nest(
 *       ['deeper' as const],
 *       (id) => `${parentPath}/${id}`,
 *       (parentPath, parentId) => ({
 *         _title: titlesById[parentId],
 *         deepest: nest(
 *           ['deepest' as const],
 *           (id) => `${parentPath}/${id}`,
 *           (_parentPath, parentId) => ({
 *             _title: titlesById[parentId]
 *           })
 *         )
 *       })
 *     )
 *   })
 * );
 * console.log(paths.value); // root
 * console.log(paths._title); // Root
 * console.log(paths.deeper.value); // root/deeper
 * console.log(paths.deeper._title); // Deeper
 * console.log(paths.deeper.deepest.value); // root/deeper/deepest
 * console.log(paths.deeper.deepest._title); // Deepest
 * ```
 */
export function nest<A, B extends object, ArgsT extends any[]>(
  args: ArgsT,
  a: (...args: ArgsT) => TypeOrPromisedType<A>,
  b: (a: A, ...args: ArgsT) => Promise<B>
): Promise<{ value: A } & B>;
export function nest<A, B extends object>(a: A, b: (a: A) => Promise<B>): Promise<{ value: A } & B>;
export function nest<A, B extends object, ArgsT extends any[]>(
  args: ArgsT,
  a: (...args: ArgsT) => Promise<A>,
  b: (a: A, ...args: ArgsT) => B
): Promise<{ value: A } & B>;
export function nest<A, B extends object, ArgsT extends any[]>(
  args: ArgsT,
  a: (...args: ArgsT) => A,
  b: (a: A, ...args: ArgsT) => B
): { value: A } & B;
export function nest<A, B extends object>(a: A, b: (a: A) => B): { value: A } & B;
export function nest<A, B extends object>(a: A, b: B): { value: A } & B;
export function nest<A, B extends object, ArgsT extends any[]>(
  aOrArgs: A | ArgsT,
  aOrB: ((...args: ArgsT) => A) | ((a: A) => TypeOrPromisedType<B>) | B,
  optB?: (a: A, ...args: ArgsT) => TypeOrPromisedType<B>
): TypeOrPromisedType<{ value: A } & B> {
  if (optB !== undefined) {
    const args = aOrArgs as ArgsT;
    const aFunc = aOrB as (...args: ArgsT) => TypeOrPromisedType<A>;
    const aResult = aFunc(...args);
    if (isPromise(aResult)) {
      return inline(async () => {
        const bFunc = optB;
        const a = await aResult;
        const b = await bFunc(a, ...args);
        return { ...b, value: a };
      });
    } else {
      const bFunc = optB;
      const bResult = bFunc(aResult, ...args);
      if (isPromise(bResult)) {
        return inline(async () => ({ ...(await bResult), value: aResult }));
      } else {
        return { ...bResult, value: aResult };
      }
    }
  } else if (typeof aOrB === 'function') {
    const a = aOrArgs as A;
    const bFunc = aOrB as (a: A) => TypeOrPromisedType<B>;
    const bResult = bFunc(a);
    if (isPromise(bResult)) {
      return inline(async () => ({ ...(await bResult), value: a }));
    } else {
      return { ...bResult, value: a };
    }
  } else {
    const a = aOrArgs as A;
    const b = aOrB as B;
    return { ...b, value: a };
  }
}

// Helpers

const inline = <ReturnT>(func: () => ReturnT) => func();
