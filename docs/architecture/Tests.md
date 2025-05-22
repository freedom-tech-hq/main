# Tests Writing Standard

## File organization

Follow [Module Structure](Module%20Structure.md) or [App Structure](App%20Structure.md) according to the module type.

## Reference code

Use [demoMockingSubject.test.ts](../../code/dev-packages/reference/src/utils/__tests__/demoMockingSubject.test.ts) as a comprehensive reference. If anything is missing there that you’ve done — update the reference.

## Principles

### AAA Pattern for Test Cases

All test cases must follow the AAA (Arrange-Act-Assert) pattern:

1. **Arrange**: Set up the test conditions (initialize objects, prepare data, mock dependencies)
2. **Act**: Execute the action being tested (call the function or method)
3. **Assert**: Verify the expected outcomes (check return values, state changes, or interactions)

In long scenarios iteration of block is acceptable.

**NB:** Do not write long scenarios out of laziness, use them only to document a complete process (i.e. as a better specification, not simply a test).

| Typical | Extra Arrange is OK |
| ------- | ------------------- |
| Arrange | Arrange             |
| Act     | Act                 |
| Assert  | Assert              |
| Act     | Arrange             |
| Assert  | Act                 |
| Act     | Assert              |
| Assert  |                     |
### Coverage

Source coverage metrics are implemented. Functional coverage process is yet to be defined.

Always wrap with `describe` block and use `async` functions for `it`. Make `it` part of the sentence that continues in the string literal.

```ts
describe('makeTheWorldHappier', () => {
  it('makes the world 3..7% happier', async () => {
     // Arrange
     ...
  });

  ...
});
```

*AI direction.* Always **start creating a test file** with a single test for a typical scenario. Always use this test name literally. User should approve and ask for more explicitly.

```ts
describe('subjectFunction', () => {
  it('handles a typical case', async () => {
     // Arrange
     ...
  });

  // Another test case idea 1 (list ideas, do not write the actual test at first)
  // Another test case idea 2
  // ...
});
```

### Assertions

It is wrong to assert complex structures line by line. When it fails, you only know the line where it has failed,
and it costs you time to dig up the failure.

```ts
// Wrong (although popular):
assert.equal(initialExistsResult.ok, true);
assert.equal(initialExistsResult.value, false);
```

Use deep equal checks instead. And also `expect()` - its DSL reads natural and the output is compatible with diff
rendering in some IDE tools.

```ts
import { expect } from 'expect';

// Fantastic readability both in code and on failure:
expect(initialExistsResult).toEqual({
  ok: true,
  value: false
});
```

### Mocked strings

Use format `the-<object kind>`. This way every time we see the value we know what it references, even if its variable name shows different aspect when we look at the code.

```ts
something({
  // Wrong:
  userId: 'test',
  userId: 'dummy',
  
  // Right:
  userId: 'the-user', // In most cases this is better
  userId: 'the-user-id', // If we accent on the id value processing, not the idea of a user
  name: 'The User',
  description: 'The Description'
});
```

## AI Knowledge

- Run single test file: `yarn test /Users/...test.ts`
- Fixture file path making: `path.resolve(import.meta.dirname, 'fixtures/file.json')`
- Init trace in Arrange: const trace = makeTrace();
