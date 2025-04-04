# Freedom

## Preparing Environment

- Install Node >= 20.11
- Run: `yarn prep` (in `code/` folder)

## Running Tests

```bash
yarn test
```

## Environment Options

| Name | Description |
| --- | --- |
| FREEDOM_BUILD_MODE | Set to `DEV` to enable compile-time development features, guarded with DEV labels.  `yarn prep:dev` implies this.  Use `yarn clean` when switching build modes |
| FREEDOM_BUILD_UUID | A string value that will be replaced at build time. |
| FREEDOM_LOG_FUNCS | (DEV build mode only) Functions to log start and completion marker lines for.  Default = `all`.  See Log Rules below. |
| FREEDOM_LOG_ARGS | For any functions logged due to `FREEDOM_LOG_FUNCS`, determines if argument values should be logged as well. See Log Rules below. |
| FREEDOM_LOG_FAILURES | (DEV build mode only) For any functions not logged due to `FREEDOM_LOG_FUNCS`, determine if failures should be logged.  Default = `all`.  See Log Rules below. |
| FREEDOM_LOG_RESULTS | For any functions logged due to `FREEDOM_LOG_FUNCS`, determines if results should be logged as well. See Log Rules below. |
| FREEDOM_MOCK_CRYPTO | (DEB build mode only) Set to `true` to cause crypto and hashing related functions to leave content as readable as possible. |
| FREEDOM_DEBUG_TOPICS | (DEV build mode only) A comma / newline set of topics to log.  See `debugTopic` function in `freedom-async` package.  A logger must be setup for this to work, ex. using `FREEDOM_VERBOSE_LOGGING=true`. |
| FREEDOM_VERBOSE_LOGGING | (DEV build mode only) Set to `true` to enable default logging automatically -- intended to be used for debugging tests.  In production, logging is normally configured using code instead. |
| FREEDOM_PROFILE | (DEV build mode only) Set to enable profiling.  Follows the same rules as Log Rules. |
| FREEDOM_MAX_CONCURRENCY_DEFAULT | If unset, the default value is `5`.  When debugging tests, it's helpful to set this to `1` to make logs easier to follow. |
| FREEDOM_LOGGING_MODE_DEFAULT | If unset, the default value is `structured`.  When debugging tests or running locally, it's sometimes easier to read flat logs, which can be done using the value: `flat`. |

## Log Rules

For the logging-related environment variables: `FREEDOM_LOG_FUNCS`, `FREEDOM_LOG_ARGS`, and `FREEDOM_LOG_RESULTS`, rules are used to select what to log.

For example: `FREEDOM_LOG_FUNCS=freedom-crypto-service/utils/makeCryptoService>generateSignedValue` selects functions where the top ID string for the trace stack is '`freedom-crypto-service/utils/makeCryptoService>generateSignedValue`'.

Multiple inclusion rules can be added by separating individual rules using commas and/or newlines.

- If the patterns list is empty (though not necessarily undefined – see default value for `FREEDOM_LOG_FUNCS`), nothing will match
- If the patterns list is '`all`', everything will match
- Otherwise, within a rule:
  - '`**`' matches anywhere in the trace stack
  - '`*`' matches anything except '`>`'
