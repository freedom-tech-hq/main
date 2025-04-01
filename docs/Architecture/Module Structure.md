# Module Structure

Each module in the Freedom project follows a consistent structure to maintain organization and clarity. This document outlines the purpose of each folder and file within a module.

## Root Directory

The root directory of a module contains configuration files and the main source code:

- `package.json`: Defines the module's dependencies, scripts, and metadata
- `tsconfig.json`: TypeScript configuration for the module
- `tsconfig.base.json`: Base TypeScript configuration that's extended by other configs
- `tsconfig.mjs.json`: TypeScript configuration for ES modules

## Folders

### src/

The `src/` directory contains all the source code for the module:

- `exports.ts`: Main entry point that re-exports all public APIs
- `types/`: Contains TypeScript type definitions and interfaces
  - `exports.ts`: Exports all type definitions
- `utils/`: Utility functions and helpers
- `impl/`: Implementation of the module's functionality

### lib/

The `lib/` directory contains the compiled output of the TypeScript code:

- Generated during the build process
- Should not be committed to version control

### node_modules/

The `node_modules/` directory contains all the dependencies installed for the module:

- Generated during package installation
- Should not be committed to version control

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
## Module Types

The project contains several types of modules:

1. **Cross-Platform Packages**: Located in `code/cross-platform-packages/`
   - Used by both server and client applications
   - Typically contain core functionality and types

2. **Server Packages**: Located in `code/server-packages/`
   - Used exclusively by server applications
   - Typically contain server-specific functionality

3. **Development Packages**: Located in `code/dev-packages/`
   - Used during development and testing
   - Typically contain build tools and testing utilities

4. **Applications**: Located in `code/apps/`
   - Complete applications built using the other packages
   - Typically have additional configuration for deployment
