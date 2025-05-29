---
status: AI-version, revise it
---
## Endpoints we need

### Product Essence (MVP-critical)

| Endpoint                      | Mandatory features                                                                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **GET /threads**              | pagination (cursor or page + size), label filter, sort (by date, sender), include = `minimal                                                                                                                    |
| **GET /threads/{threadId}**   | full message tree with MIME parts, per-message metadata (`id`, `from`, `to`, `cc`, `date`, `snippet`, `isUnread`, `labels[]`), attachment stubs                                                                 |
| **GET /messages**             | supports `labelId`, `q` (simple search string), `pageToken/limit`, sort; returns flat list (no threading)                                                                                                       |
| **GET /messages/{messageId}** | full raw RFC 822 body, parsed body, attachment metadata, delivery headers                                                                                                                                       |
| **POST /messages/send**       | JSON or `multipart/form-data`; required: `to[]`, `subject`, `body` (HTML or plain), optional `cc[]`, `bcc[]`, `inReplyTo`, `references[]`, attachments; server returns new `threadId`, `messageId`, server date |
| **POST /drafts**              | create empty draft, returns `draftId`                                                                                                                                                                           |
| **PUT /drafts/{draftId}**     | upsert fields identical to send payload; server revision number                                                                                                                                                 |
| **DELETE /drafts/{draftId}**  | hard delete draft                                                                                                                                                                                               |
| **PUT /messages/{id}/labels** | body: `{ add:[], remove:[] }`; atomic                                                                                                                                                                           |
| **PUT /messages/{id}/unread** | body: `{ isUnread: true                                                                                                                                                                                         |
| **GET /labels**               | returns all system and user labels with `id`, `name`, `type=system                                                                                                                                              |
| **POST /labels**              | create user label; body needs `name`                                                                                                                                                                            |
| **DELETE /labels/{labelId}**  | remove user label (optionally relabel children)                                                                                                                                                                 |

These cover **List**, **Search**, **Labels**, **Threads**, **Draft manipulation**, **Sending**, **Unread status**, and basic **labeling**.

---

### Not critical but market-expected

|Endpoint|Mandatory features|
|---|---|
|**POST /messages/batchModify**|bulk add/remove labels, unread flag on up to N (e.g. 1000) message IDs|
|**POST /messages/batchDelete**|bulk trash or permanently delete list of message IDs|
|**GET /messages/{id}/attachments/{partId}**|streamed download with HTTP range|
|**GET /attachments/{uploadUrl}**|pre-signed upload URL for drafts/sends; size & type validation|
|**POST /messages/import**|deliver external raw RFC 822 message into a mailbox (server assigns labels)|
|**GET /user/settings**|aggregate: signature (HTML), “vacation responder”, time zone, default reply-all|
|**PUT /user/settings**|partial update|
|**GET /user/filters**|list of rule objects `{ id, criteria, actions }`|
|**POST /user/filters** / **DELETE /user/filters/{id}**|CRUD mail filters (auto-label, auto-archive, forward)|
|**GET /user/identity**|list verified “send-as” addresses; includes DKIM/SPF status|
|**POST /messages/sendScheduled**|same payload as _send_, plus RFC 3339 `sendAt` – scheduler guarantees delivery|

---

### Extras (nice-to-have / competitive)

|Endpoint|Mandatory features|
|---|---|
|**POST /messages/snooze**|body: `{ messageIds:[], until: <RFC3339> }`; moves to “Snoozed” label and schedules auto-unsnooze|
|**POST /messages/undoSend**|window ≤ N seconds; body: `{ messageId }`|
|**POST /messages/template**|save current draft as reusable template (`name`, `html`, `text`)|
|**GET /analytics/activity**|aggregated counts per label, per day, unread trends|
|**WS /notifications** (or HTTP SSE)|push new message + thread updates, quota warnings|
|**GET /security/auditLogs**|paginated, immutable logs of sign-ins, setting changes, filter edits|
|**POST /user/settings/pushRules**|mobile/web push-notification preferences per label, per importance|
|**GET /labels/hierarchy**|nested label tree with parent/child ordering hints (for power users)|
|**PUT /threads/{id}/mute**|suppress notifications until new message from non-muted sender|

---

## Notes on design conventions

- **Consistent IDs** – every object exposes a stable opaque `id` that never leaks internal SQL keys.
    
- **ETags and revision numbers** on _drafts_, _filters_, and _settings_ to prevent lost updates.
    
- **Label-driven model** – unread, starred, important, snoozed, trash are implemented as first-class system labels, so the same label modification endpoint covers most state flips.
    
- **Thread-safe searches** – `/messages` and `/threads` accept a unified `q` that follows Gmail-like grammar (`from:`, `label:`, `before:`).
    
- **Bulk endpoints** reduce HTTP-round-trips, crucial for a responsive Gmail-style UI.