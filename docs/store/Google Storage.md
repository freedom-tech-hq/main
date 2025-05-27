# Google Storage

Implemented in `freedom-google-storage-syncable-store-backing`

## Google Storage caveats

### It is slow

More or less tolerable when I (Pavel) run tests locally (from Serbia) to a bucket in Switzerland or Finland.

Total failure for a bucket in Iowa, but this could be the opposite for a server hosted in GCP or otherwise in the US.

But it is still slow even when tolerable. We should probably implement directory listing and mutable metadata as a DB (BigQuery or Postgres).

Later update: I noticed that the same scenario is also slow for FS backing. Need more research.

### Hierarchical Storage option

It does not work for us:

Error: The object test-europe-fgdfhgfjjg/test_20250521-175342.196/STORAGE_test/_/EyTF89903e0a-9ced-4428-aea3-f43551716efc exceeded the rate limit for object mutation operations (create, update, and delete). Please reduce your request rate. See https://cloud.google.com/storage/docs/gcs429.

Error: The object test-europe-fgdfhgfjjg/test_20250521-175354.754/_/STORAGE_test exceeded the rate limit for object mutation operations (create, update, and delete). Please reduce your request rate. See https://cloud.google.com/storage/docs/gcs429.
