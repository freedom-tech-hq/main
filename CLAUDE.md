# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- Build: `yarn build` (dev mode: `yarn build:dev`)
- Lint: `yarn lint`
- Test: `yarn test` (dev mode: `yarn test:dev`)
- Run single test: `yarn test /path/to/test.ts`
- Pre-commit check: `yarn pre-commit`

## Code Style
- TypeScript with strict typing, use `import type` for importing types
- Single quotes for JS/TS, double quotes for JSX attributes
- 2-space indentation
- Prefer arrow functions with explicit return types
- Components use React functional style with hooks
- Use the `parseFrom` function from 'email-addresses' to handle email addresses

## Test Standards
- Follow AAA pattern: Arrange-Act-Assert
- Tests in `__tests__` folders adjacent to code
- Always use `describe` blocks and `it` with async functions
- Make `it` part of a sentence that continues in the string literal
- Start with a typical case test, then add specific scenarios