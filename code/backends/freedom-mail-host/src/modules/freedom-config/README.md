# Freedom Config Module

TODO: Extract to a package in the future.

A configuration framework that wraps the `env-var` package and adds more validation capabilities.

**Note:** The `loadEnv` function is only compatible with Node.js environments and will not work in frontend applications. However, the `from` function is compatible with both frontend and backend environments.

## Usage

```typescript
import { from } from 'freedom-config';

// Create an environment accessor
const env = from(process.env);

// Basic usage with default values and type conversion
const port = env.get('PORT').default('3000').asInt();
const host = env.get('HOST').default('localhost').asString();

// Using custom validators
const result = env.get('CUSTOM_VAR').asCustom((value) => {
  const [key, val] = value.split(':');
  return { key, value: Number(val) };
});
```

## Custom Validators

See [from.test.ts](./src/__tests__/from.test.ts) for demonstration.

## Environment Loading

The module provides a utility to load environment variables from .env files with a specific priority order:

```typescript
import { loadEnv } from 'freedom-config';

// Load environment variables from .env files in the project root
loadEnv('/path/to/project/root');
```

### Priority Order

For non-test environments, .env files are loaded in the following order (highest to lowest priority):

1. `.env.[NODE_ENV].local`
2. `.env.local`
3. `.env.[NODE_ENV]`
4. `.env`

For test environments, only `.env.test` is loaded.
