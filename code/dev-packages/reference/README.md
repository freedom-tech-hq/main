# Reference Module

A simple reference module that provides string utility functions and demonstrates testing with mocking. This module is intended as a reference implementation for the Freedom project.

## Features

- String utility functions (capitalize, truncate)
- Test examples using Node.js built-in test runner
- Examples of mocking in tests

## Usage

```typescript
import { capitalize, truncate } from 'freedom-reference';

// Capitalize a string
const capitalized = capitalize('hello'); // 'Hello'

// Truncate a string
const truncated = truncate('This is a long string', 10); // 'This is...'
```
