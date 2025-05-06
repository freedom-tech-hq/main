import { uncheckedResult } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import type { SyncableItemName } from 'freedom-sync-types';
import type { StoreBase } from 'freedom-syncable-store-types';
import { isString } from 'lodash-es';

export async function prettyStoreLs(store: StoreBase, { returnOnly = false }: { returnOnly?: boolean } = {}): Promise<string[]> {
  const trace = makeTrace('test');

  // Ls
  const lines = await uncheckedResult(
    store.ls(trace, {
      format: ({ itemId, dynamicName }) => {
        // Make the name readable and paint it
        let readableName: string;
        let readableId: string | undefined;

        if (dynamicName === undefined) {
          // Encrypted and unable to decrypt
          readableName = '\x1b[90m[NOT DECRYPTED]\x1b[0m'; // Gray
          readableId = itemId;
        } else if (isString(dynamicName)) {
          // Plain
          const plainName = humanizeItemName(dynamicName);
          readableName = `\x1b[33m${plainName}\x1b[0m`; // Yellow
          readableId = itemId === plainName ? undefined : itemId;
        } else {
          // Decrypted
          readableName = `\x1b[34m${dynamicName.plainName}\x1b[0m`; // Blue
          readableId = itemId;
        }

        // Append the ID only when informative. Faint color
        return readableName + (readableId === undefined ? '' : ` \x1b[2m${itemId}\x1b[0m`);
      }
    })
  );

  // Add root
  const root = await uncheckedResult(store.getMetadata(trace));
  for (let i = 0; i < lines.length; i++) {
    lines[i] = `  ${lines[i]}`; // Indent
  }
  lines.unshift(`${store.path.storageRootId} \x1b[90m${root.name}\x1b[0m`);

  // Log by default
  if (!returnOnly) {
    console.log(lines.join('\n'));
  }

  return lines;
}

function humanizeItemName(dynamicName: SyncableItemName): string {
  // EnTb._EnTfT_2025-05-05T22:23:03.490Z-7cf3650c-5d15-4a9d-ae63-f12353057dde-deltas
  let matches = dynamicName.match(
    /(EnTb\._EnTfT)_(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)-([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})(.*)/
  );
  if (matches !== null) {
    return `${matches[2].replace('T', ' ').replace('Z', '')}${matches[4]}`;
  }

  // EnTfT_2025-05-06T17:00:03.365Z-836596df-aabb-4dc9-a9a6-3a9342140ab9
  matches = dynamicName.match(
    /(EnTfT)_(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)-([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})(.*)/
  );
  if (matches !== null) {
    return `${matches[2].replace('T', ' ').replace('Z', '')}${matches[4]}`;
  }

  // EnTb._access-control
  matches = dynamicName.match(/(EnTb)(\._.+)/);
  if (matches !== null) {
    return matches[2];
  }

  return dynamicName;
}
