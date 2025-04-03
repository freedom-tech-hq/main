# Freedom Build Tools

Shared build tools for packages in The Freedom Network monorepo.

Note: these build tools only support ES modules.

This creates the following tool:

## freedom-build

freedom-build:

- looks for `import.meta.filename` and replaces that, at build time, with a simplified version of the relative file path
- updates the suffixes of local imports (those starting with './' or '../') ending with '.js' so they end with '.mjs'
- strips code statements labeled either `DEV:`, depending on the `FREEDOM_BUILD_MODE` environment variable

### FREEDOM_BUILD_MODE

If `FREEDOM_BUILD_MODE` is `DEV`, `DEV:` labeled statements are NOT removed at compile time.  Otherwise, `DEV:` labeled statements ARE removed.

## Usage

In each monorepo package, the `package.json` file contains a build script similar to:

```bash
…
"build": "tsc -p tsconfig.mjs.json --emitDeclarationOnly && node ../../dev-packages/freedom-build-tools/lib/mjs/freedom-build.mjs --tsconfig tsconfig.mjs.json"
…
```

The above:

- builds the package, performing all the usual type checking, but only emitting type declarations files
- builds again, replacing `import.meta.filename` and emitting all JavaScript code using `.mjs` extensions

The path simplification process is such that:

- the current working directory is removed as a prefix
- `/src` is removed as a prefix
- `.js`, `.jsx`, `.ts`, `.tsx`, `.cjs`, `.mjs` are removed as suffixes
- the package name is prepended

For example, in `freedom-async` in `src/utils/allResults.ts`, we have a reference to `import.meta.filename`, which is changed to `"freedom-async/utils/allResults"` at build time.
