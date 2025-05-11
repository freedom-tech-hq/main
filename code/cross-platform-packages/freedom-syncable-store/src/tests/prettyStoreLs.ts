import { uncheckedResult } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import type { SyncableItemName } from 'freedom-sync-types';
import type { StoreBase } from 'freedom-syncable-store-types';
import { isString } from 'lodash-es';

import { DefaultSyncableStore } from '../types/DefaultSyncableStore.ts';

export async function prettyStoreLs(store: StoreBase, { returnOnly = false }: { returnOnly?: boolean } = {}): Promise<string[]> {
  const trace = makeTrace('test');

  // Ls
  const lines = await uncheckedResult(
    store.ls(trace, {
      formatter: ({ itemType, itemId, dynamicName }) => {
        // Make the name readable and paint it
        let readableName: string;
        let readableId: string | undefined;

        if (dynamicName === undefined) {
          // Should not happen
          readableName = '\x1b[90m[NO dynamicName]\x1b[0m'; // Gray
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

        // Icon
        let icon: string = '?';
        if (itemType === 'file') {
          icon = '📄';
        } else if (itemType === 'folder') {
          icon = '📂';
        } else if (itemType === 'bundle') {
          icon = '📦';
        }

        // Append the ID only when informative. Faint color
        return icon + readableName + (itemType !== 'file' ? '/' : '') + (readableId === undefined ? '' : `  \x1b[2m${itemId}\x1b[0m`);
      }
    })
  );

  // Add root
  for (let i = 0; i < lines.length; i++) {
    lines[i] = `  ${lines[i]}`; // Indent
  }
  if (store instanceof DefaultSyncableStore) {
    const root = await uncheckedResult(store.getMetadata(trace));
    lines.unshift(`\x1b[90m${store.path.storageRootId}\x1b[0m \x1b[2m${root.name}\x1b[0m`);
  } else {
    lines.unshift(`\x1b[90m[Cannot deterimine root name for non DefaultSyncableStore]\x1b[0m`);
  }

  // Log by default
  if (!returnOnly) {
    console.log(lines.join('\n'));
  }

  return lines;
}

function humanizeItemName(dynamicName: SyncableItemName): string {
  // EnTb._EnTfT_2025-05-05T22:23:03.490Z-7cf3650c-5d15-4a9d-ae63-f12353057dde-deltas
  let matches = dynamicName.match(
    /^(E[yn]Tb\._E[yn]TfT)_(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)-([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})(.*)/
  );
  if (matches !== null) {
    return `${matches[2].replace('T', ' ').replace('Z', '')}${matches[4]}`;
  }

  // EnTfT_2025-05-06T17:00:03.365Z-836596df-aabb-4dc9-a9a6-3a9342140ab9
  // EyTfMAIL_2025-05-06T18:45:09.855Z-e21bb166-7f31-48ba-91c2-369c0d5488ce
  matches = dynamicName.match(
    /^(E[yn]Tf)(T|MAIL)_(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)-([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})(.*)/
  );
  if (matches !== null) {
    return `${matches[2]} ${matches[3].replace('T', ' ').replace('Z', '')}${matches[5]}`;
  }

  // EnTb._access-control
  // EyTb._2025
  matches = dynamicName.match(/^(E[yn]Tb)(\._.+)/);
  if (matches !== null) {
    return matches[2];
  }

  return dynamicName;
}
