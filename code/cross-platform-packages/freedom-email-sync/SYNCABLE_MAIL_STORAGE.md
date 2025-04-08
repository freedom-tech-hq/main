# Syncable Mail Storage

## File Layout

### Client-Server Shared

```plaintext
/saltedId(storage) # folder, server only creates/appends
    /plainId(<year>) # bundle, utc
        /plainId(<month>)
            /plainId(<date>)
                /plainId(<hour>)
                    /<mail-id>
                        /saltedId(summary.json)
                        /saltedId(detailed.json)
                        /saltedId(attachments) # only if needed
                            /<attachment-id>
                                /saltedId(chunk-<chunkNumber>) # binary

/saltedId(out) # folder, server gets read/write access
    /plainId(<year>) # bundle
        /plainId(<month>)
            /plainId(<date>)
                /plainId(<hour>)
                    /<mail-id>
                        /saltedId(summary.json)
                        /saltedId(detailed.json)
                        /saltedId(attachments) # only if needed
                            /<attachment-id>
                                /saltedId(chunk-<chunkNumber>) # binary
```

### Client Only

_These are still synced, but server can't read or write to these._

```typescript
/saltedId(collections) # bundle
    /saltedId(<collection-type>) # except custom
        /plainId(<year>)
            /plainId(<month>) # Collection Doc CRDT
    /saltedId(custom)
        /saltedId(collection-meta) # Collection Meta Doc CRDT
        /<custom-collection-id>
            /plainId(<year>)
                /plainId(<month>) # Collection Doc CRDT

/saltedId(drafts) # bundle
    /<draft-id>
        /saltedId(draft) # Draft Doc CRDT
        /saltedId(attachments) # only if needed
            /<attachment-id>
                /saltedId(chunk-<chunkNumber>) # binary

/saltedId(indexes) # bundle
    /saltedId(mail-ids-by-message-id)
        /plainId(<year>)
            /plainId(<month>) # Mail IDs (Freedom) by Message ID (Industry Standard-ish) Doc CRDT

/saltedId(threads) # bundle
    /plainId(<year>)
        /plainId(<month>) # Thread Doc CRDT
```

## File Info

### Summary JSON file

| Field | Description |
| --- | --- |
| `from` | `Array<{ address: string, name?: string }>` |
| `subject` | `string` |
| `bodyAbbrev` | `string` (first 1000 plaintext chars, after basic cleanup and whitespace reduction) |
| `numAttachments` | `number` |
| `messageBytes` | `number` (including attachments) |

### Detailed JSON file

| Field | Description |
| --- | --- |
| `from` | `Array<{ address: string, name?: string }>` |
| `subject` | `string` |
| `bodyAbbrev` | `string` (first 1000 plaintext chars, after basic cleanup and whitespace reduction) |
| `numAttachments` | `number` |
| `messageBytes` | `number` (including attachments) |
| `to` ' | `string[]` |
| `cc` | `string[]` |
| `replyTo` | `string` |
| `otherHeaders` | `Record<string, string \| string[]>` |
| `body` | `Record<string, { encoding: 'string' \| 'base64', data: string }>` (values by MIME type, including charset if found) |
| `attachmentInfo` | `Record<string, { mimeType: string, sizeBytes: number, numChunks: number }>` (values by ID) |

### Out Status JSON file

| Field | Description |
| --- | --- |
| `statusById` | `Record<string, 'waiting' \| 'sending' \| 'sent'>` |

### Draft doc (CRDT)

| Field | Description |
| --- | --- |
| `inReplyToMailId` | `string?` |
| `to` | `string` |
| `cc` | `string[]` |
| `bcc` | `string[]` |
| `replyTo` | `string` |
| `subject` | `string` |
| `body` | rich text |
| `attachmentInfo` | `Record<string, { mimeType: string, sizeBytes: number, numChunks: number }>` (values by ID) |

### Collection doc (CRDT)

| Field | Description |
| --- | --- |
| `mailIds` | `string[]` |

### Collection Meta doc (CRDT)

| Field | Description |
| --- | --- |
| `name` | `string` |

### Mail ID by Message ID Doc (CRDT)

| Field | Description |
| --- | --- |
| `mailIdsByMessageId` | `Record<string, string>` |

### Threads doc (CRDT)

| Field | Description |
| --- | --- |
| `mailIdsThreadId` | `Record<string, string[]>` |
| `threadMetadata` | `Record<string, { subject: string; }>` (subject should not include "re:"-like prefixes; we'll probably need different sets of criteria to create threads: subject and/or message-id, in-reply-to, references headers) |
| `threadIdsByMailId` | `Record<string, string>` |
