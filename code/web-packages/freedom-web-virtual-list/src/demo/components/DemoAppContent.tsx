import { Button, CircularProgress, ListItem, ListItemText, Stack } from '@mui/material';
import { makeUuid } from 'freedom-contexts';
import { ArrayDataSource } from 'freedom-data-source';
import { generatePseudoWord } from 'pseudo-words';
import { useMemo } from 'react';
import { BC, useBinding, useBindingEffect, useCallbackRef } from 'react-bindings';
import { SortedArray } from 'yasorted-array';

import { VirtualList } from '../../components/VirtualList.tsx';
import type { VirtualListDelegate } from '../../types/VirtualListDelegate.ts';

interface Entry {
  id: string;
  timeMSec: number;
  value: string;
}

export const DemoAppContent = () => {
  const mode = useBinding<'add' | 'remove' | 'move' | 'update' | 'stop'>(() => 'add', { id: 'mode', detectChanges: true });
  const multiple = useBinding<boolean>(() => false, { id: 'multiple', detectChanges: true });

  const items = useMemo(() => new SortedArray<Entry>((a, b) => b.timeMSec - a.timeMSec), []);

  const dataSource = useMemo(() => {
    const out = new ArrayDataSource(items, {
      getKeyForItemAtIndex: (index) => items[index].id
    });
    out.setIsLoading('end');
    return out;
  }, [items]);

  useBindingEffect(mode, (mode) => dataSource.setIsLoading(mode === 'add' ? 'end' : false), { triggerOnMount: true });

  const delegate = useMemo<VirtualListDelegate<Entry, string, 'template'>>(
    () =>
      ({
        getTemplateIdForItemAtIndex: (_index) => 'template',
        renderItem: (_key, item, _index) => {
          return (
            <ListItem sx={{ borderBottom: '1px dashed #ccc' }}>
              <ListItemText primary={item.value} secondary={String(item.timeMSec)} />
            </ListItem>
          );
        },
        getEstimatedSizeAtIndex: (_index) => 73,
        renderEmptyIndicator: () => (
          <ListItem>
            <ListItemText secondary="Empty" />
          </ListItem>
        ),
        renderLoadingIndicator: () => (
          <ListItem sx={{ justifyContent: 'center' }}>
            <CircularProgress size={22} />
          </ListItem>
        ),
        itemPrototypes: {
          template: {
            isSizeDynamic: false,
            defaultEstimatedSizePx: 73,
            Component: () => (
              <ListItem sx={{ borderBottom: '1px dashed #ccc' }}>
                <ListItemText primary="Value" secondary={String(Date.now())} />
              </ListItem>
            )
          }
        }
      }) satisfies VirtualListDelegate<Entry, string, 'template'>,
    []
  );

  const processMode = () => {
    switch (mode.get()) {
      case 'add': {
        for (let i = 0; i < (multiple.get() ? 3 : 1); i += 1) {
          const newIndex = items.add({
            id: makeUuid(),
            timeMSec: Math.random(),
            value: `${generatePseudoWord()} ${generatePseudoWord()} ${generatePseudoWord()}`
          });
          dataSource.itemsAdded({ indices: [newIndex] });
        }

        break;
      }
      case 'remove': {
        for (let i = 0; i < (multiple.get() ? 3 : 1); i += 1) {
          if (items.length > 0) {
            const randomIndex = Math.floor(Math.random() * items.length);
            const removedIndex = items.removeAtIndex(randomIndex);
            if (removedIndex >= 0) {
              dataSource.itemsRemoved({ indices: [removedIndex] });
            }
          }
        }

        break;
      }
      case 'move': {
        for (let i = 0; i < (multiple.get() ? 3 : 1); i += 1) {
          if (items.length > 1) {
            const randomIndex = Math.floor(Math.random() * items.length);
            const item = items[randomIndex];
            const removedIndex = items.removeAtIndex(randomIndex);
            if (removedIndex >= 0) {
              item.timeMSec = Math.random();
              const newIndex = items.add(item);
              dataSource.itemsMoved({ indices: [[removedIndex, newIndex]] });
            }
          }
        }

        break;
      }
      case 'update': {
        for (let i = 0; i < (multiple.get() ? 3 : 1); i += 1) {
          if (items.length > 1) {
            const randomIndex = Math.floor(Math.random() * items.length);
            const item = items[randomIndex];
            item.id = makeUuid();
            item.value = `${generatePseudoWord()} ${generatePseudoWord()} ${generatePseudoWord()}`;
            dataSource.itemsUpdated({ indices: [randomIndex] });
          }
        }

        break;
      }
      case 'stop': {
        break;
      }
    }

    setTimeout(processMode, 1000);
  };
  setTimeout(processMode, 1000);

  const onClearClick = useCallbackRef(() => {
    items.clear();
    dataSource.itemsCleared();
  });

  return (
    <>
      <Stack direction="row" justifyContent="space-between" gap={1} sx={{ m: 1 }}>
        <Stack direction="row" gap={4}>
          {BC(mode, (mode, modeBinding) => (
            <Stack direction="row" gap={1}>
              <Button color="primary" variant={mode === 'add' ? 'contained' : 'outlined'} onClick={() => modeBinding.set('add')}>
                Add
              </Button>
              <Button color="primary" variant={mode === 'remove' ? 'contained' : 'outlined'} onClick={() => modeBinding.set('remove')}>
                Remove
              </Button>
              <Button color="primary" variant={mode === 'move' ? 'contained' : 'outlined'} onClick={() => modeBinding.set('move')}>
                Move
              </Button>
              <Button color="primary" variant={mode === 'update' ? 'contained' : 'outlined'} onClick={() => modeBinding.set('update')}>
                Update
              </Button>
              <Button color="secondary" variant={mode === 'stop' ? 'contained' : 'outlined'} onClick={() => modeBinding.set('stop')}>
                Stop
              </Button>
            </Stack>
          ))}
          {BC(multiple, (multiple, multipleBinding) => (
            <Button
              color="primary"
              variant={multiple ? 'contained' : 'outlined'}
              onClick={() => multipleBinding.set(!multipleBinding.get())}
            >
              Multiple
            </Button>
          ))}
        </Stack>
        <Button color="error" variant="outlined" onClick={onClearClick}>
          Clear
        </Button>
      </Stack>
      <VirtualList dataSource={dataSource} delegate={delegate} scrollParent={window} />
    </>
  );
};
