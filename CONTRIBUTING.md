# Contributing to Freedom

Thank you for your interest in contributing to Freedom!

We welcome contributions from everyone. Please read the following guidelines to help us maintain a high standard of quality and collaboration.

## Getting Started

1. **Fork the repository** and clone it to your local machine.

2. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b your-feature-name
   ```

## Code Guidelines

- Follow the existing code style and structure.
- For TypeScript:
  - Use `.ts` extensions in imports.
  - Use `exports.ts` in library packages, not `index.ts`.
  - Use `import type` for importing types.
  - Do **not** change `tsconfig` or install new TS runners/builders.
  - Do **not** create `.d.ts` files or definitions unless explicitly approved.
- New tests should follow the **AAA (Arrange, Act, Assert)** pattern.
- Do **not** catch errors unless explicitly asked. Never catch to log or replace text.

## Making Changes

1. **Make your changes** in your feature branch.
2. **Test your changes** thoroughly. Add or update tests as needed.
3. **Commit your changes** with clear and descriptive commit messages.
4. **Push your branch** to your forked repository.
5. **Open a Pull Request (PR)** against the main branch.

## Pull Request Process

- Clearly describe the purpose of your PR and any relevant context.
- Reference any related issues.
- Ensure all CI checks pass before requesting a review.
- Be responsive to feedback and ready to make requested changes.

---

Be free.
