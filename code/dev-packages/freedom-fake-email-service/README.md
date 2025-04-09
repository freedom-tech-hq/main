# Freedom Fake Email Service

## Environment Variables

| Name | Description |
| --- | --- |
| FREEDOM_FAKE_EMAIL_SERVICE_ROOT_STORAGE_PATH | Default = "TEMP".  Set to "TEMP" to allocate a new temporary directory or any other, already existing, directory path to use a fixed system path. |

_Overriding FREEDOM_FAKE_EMAIL_SERVICE_ROOT_STORAGE_PATH at runtime will have no effect after `getAllStorageRootPath` is called the first time._
