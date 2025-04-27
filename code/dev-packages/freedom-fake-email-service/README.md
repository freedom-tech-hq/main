# Freedom Fake Email Service

## Environment Variables

| Name | Description |
| --- | --- |
| STORAGE_ROOT_PATH | Default = "TEMP".  Set to "TEMP" to allocate a new temporary directory or any other, already existing, directory path to use a fixed system path. |

_Overriding STORAGE_ROOT_PATH at runtime will have no effect after `getAllStorageRootPath` is called the first time._
