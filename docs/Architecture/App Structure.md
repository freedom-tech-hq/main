# App Structure

This document outlines the standard structure for applications in the Freedom project.

## Overview

Freedom applications follow a modular architecture pattern that emphasizes separation of concerns, maintainability, and code reuse. Each application is organized into modules that encapsulate specific functionality.

## Directory Structure

```
app/
├── src/
│   ├── main.ts                  # Main entry point
│   ├── config.ts                # Configuration and environment variables
│   ├── types/                   # TypeScript type definitions
│   │   ├── exports.ts           # Exports all type definitions
│   │   └── ...                  # Type definition files
│   ├── modules/                 # Functional modules
│   │   ├── module-name/         # A specific module
│   │   │   ├── index.ts         # Exports from the module
│   │   │   └── utils/           # Utility functions for the module
│   │   │       ├── function1.ts # One function per file
│   │   │       └── function2.ts # Another function
│   │   └── ...                  # Other modules
│   ├── utils/                   # Shared utility functions
│   └── tasks/                   # Background tasks
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Documentation
```

## Modules

The `modules/` directory contains the core functionality of the application, organized by domain or feature. Each module should:

1. Be self-contained with minimal dependencies on other modules
2. Have a clear, single responsibility
3. Export its functionality through an `index.ts` file
4. Implement functions in individual files within a `utils/` directory

### Common Module Types

1. **HTTP Server Module**: Handles HTTP requests and responses
   - Example: `modules/http-server/`
   - Functions: `createServer.ts`, `startServer.ts`

2. **Data Processing Module**: Processes and transforms data
   - Example: `modules/email-encoder/`
   - Functions: `processEmail.ts`, `extractEmailAddress.ts`

3. **Storage Module**: Manages data persistence
   - Example: `modules/storage/`
   - Functions: `loadUsers.ts`, `saveToStorage.ts`, `getBucket.ts`

## Function Files

Each function should be defined in its own file within the module's `utils/` directory. Function files should:

1. Have a clear, descriptive name that matches the function name
2. Export a single function as the default export
3. Include proper JSDoc comments
4. Be focused on a single responsibility

Example:
```typescript
/**
 * Extract email address from a string that might be in the format "Name <email@example.com>"
 */

export function extractEmailAddress(addressString: string | undefined): string {
  if (!addressString) {
    return '';
  }
  
  // Check if the address is in the format "Name <email@example.com>"
  const match = addressString.match(/<([^>]+)>/);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  
  // Otherwise, return the original string
  return addressString.toLowerCase();
}
```

## Configuration

Application configuration should be centralized in a `config.ts` file that:

1. Exports individual configuration values (not grouped in objects)
2. Handles environment variable parsing and defaults
3. Includes descriptive comments for each configuration value

Example:
```typescript
/**
 * Server configuration
 */

/** Port to run the server on */
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/** Host to bind the server to */
export const HOST = '0.0.0.0';

/**
 * Storage configuration
 */

/** Google Cloud Storage bucket for storing emails and user data */
export const APP_BUCKET = process.env.APP_BUCKET || 'user-files-dev-abd0971d';

/** Path to the users database file */
export const USERS_FILE = 'users.json';
```

## Types

Type definitions should be organized in the `types/` directory and exported through `types/exports.ts`. Each type should:

1. Have a clear, descriptive name
2. Include proper JSDoc comments
3. Be focused on a specific data structure

## Testing

Tests are organized in `__tests__` directories adjacent to the code being tested:

- Each module should have tests for its public API
- Tests should be located in a `__tests__` directory within the same directory as the code being tested
- Test files should be named with the `.test.ts` extension
- Use the Node.js built-in test runner with `describe` and `it` blocks
- Helper functions for testing can be placed in a `__test_dependency__` directory at the module root

Example test structure:
```
src/
├── types/
│   ├── __tests__/
│   │   └── SomeType.test.ts
│   └── SomeType.ts
├── utils/
│   ├── __tests__/
│   │   └── someUtil.test.ts
│   └── someUtil.ts
└── __test_dependency__/
    └── testHelpers.ts
```

Use [Tests](Tests.md) guide to write the test files.

## Best Practices

1. **Imports**: Import configurations as a namespace: `import * as config from '../../config'`
2. **Exports**: Use named exports rather than default exports
3. **Function Size**: Keep functions small and focused on a single task
4. **Dependencies**: Minimize dependencies between modules
5. **Documentation**: Include JSDoc comments for all functions and types
