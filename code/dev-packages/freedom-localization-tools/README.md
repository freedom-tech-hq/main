# Freedom Localization Tools

Shared build-time localization-related tools for packages in The Freedom Network monorepo.

## Overview

Default localization strings are added directly in code, using forms like:

```typescript
const ns = 'ui';
const $appName = LOCALIZE('Freedom Mail')({ ns });
const $helloMessage = LOCALIZE`Hello ${'name'}`({ ns });
```

For each `LOCALIZE` statement above, `ns` must be either a string literal or the `ns` identifier.  If an `ns` variable is defined in the same file, its value must be a string literal.

Default localization keys are automatically determined by transforming the default value string using `value.normalize('NFD').toLocaleLowerCase().replace(/\s+|_/g, '')`.  For simple values, like `'Freedom Mail'`, the key is `freedommail`.

For parameterized localizations, the parameter names themselves are also normalized in the same way and wrapped with underscores, so the default key for ``` `Hello ${'name'}` ``` is `hello_name_`.

However, if desired, keys may be manually specified using string literals like:

```typescript
const $appName = LOCALIZE('Freedom Mail')({ ns, key: 'forced-key' });
```

Other language strings should be included in loadable resource files, which should be located somewhere in your source folder, in a subfolder called "localization".  Filenames should be like `<locale-code>.json`.  For example, you might have `src/localization/fr.json`.  Use `registerNamespaceLoaderForLanguage` in `freedom-localization` to configure loading for these resources.  Localization JSON files should have effective types: `Record<string, Record<string, string>>` where the top level keys are namespaces and the inner keys are localization string keys.  For example:

```json
{
    "ui": {
        "freedommail": "Courriel Liberté",
        "hello_name_": "Bonjour {{name}}"
    }
}
```

### Pluralization

In addition to `LOCALIZE`, we support `PLURALIZE`, which is used like:

```typescript
const $monthsAgo = PLURALIZE<'amount'>({
  one: LOCALIZE`${'amount'} month ago`({ ns }),
  other: LOCALIZE`${'amount'} months ago`({ ns })
});
```

The `other` key is required, but all other keys are optional and may include: `zero`, `one`, `two`, `few`, and/or `many`.
  
_Note: the default PFunction implementation, which is used to decide count category, only handles 0, 1, and 2 cases specially and treats all other counts as `other`.  However, custom `PFunctions` can be provided.  See `PFunctionProvider` in `freedom-react-localization`._

#### React Example

```typescript
const MyComponent = ({ numMonthsAgo }: { numMonthsAgo: number }) => {
  const p = useP();

  return <Typography>{$monthsAgo(numMonthsAgo, p, { amount: `${numMonthsAgo}` })}</Typography>
}
```

#### Node Example

```typescript
const logNumMonthsAgo = ({ numMonthsAgo }: { numMonthsAgo: number }) => {
  const t = getT();
  const p = makeDefaultPFunction(t);

  console.log('Time:', $monthsAgo(numMonthsAgo, p, { amount: `${numMonthsAgo}` }));
}
```

## Check Localizations Tool

The Check Localizations tool scans code in the specified folder and checks that:

- There are appropriate non-default language localizations for each key used in the codebase
- That the same key isn't reused within a namespace (it is ok though if values are declared twice as long as their default values match)
- That all parameters are consistently used in all localizations
- That there aren't extraneous keys in non-default language localization files

### Usage

In each monorepo package that might contain localized strings, the `package.json` file should contain a build script similar to:

```bash
…
"test": "yarn test:localizations && …",
"test:localizations": "../../dev-packages/freedom-localization-tools/lib/mjs/check-localizations.js --in src"
…
