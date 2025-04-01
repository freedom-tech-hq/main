# Creating a New Module

## Generic Module Files

Do this step by step. Use `code/cross-platform-packages/freedom-syncable-store-types` as a reference module.

- [ ] Create the module directory in the appropriate location (`code/cross-platform-packages/`, `code/server-packages/`, etc.)
- [ ] Copy as is the following files from the reference module:
  - [ ] `package.json`
  - [ ] `tsconfig.json`
  - [ ] `tsconfig.base.json`
  - [ ] `tsconfig.mjs.json`
- [ ] Adjust `package.json` for the new module
- [ ] Create the basic directory structure:
  - [ ] `src/`
  - [ ] `src/types/`
  - [ ] `src/types/__tests__`
- [ ] Create the following files:
  - [ ] `src/exports.ts`
  - [ ] `src/types/exports.ts`
- [ ] Create `README.md`, fill it with reasonable description of the module, if you have one. One short paragraph with the purpose.
- [ ] Add the module to `code/freedom-email.code-workspace` in the "folders" array

## Custom Implementation

Refer to [Module Structure](../Architecture/Module%20Structure.md) for a detailed explanation of each folder's purpose.

Remember to follow the project's coding standards and patterns when implementing your module.

## AI Agent Memory

- Use shell commands to copy
- Never edit tsconfig files, only copy them
- Follow the order. Never write the custom code until the generic section steps are all completed
