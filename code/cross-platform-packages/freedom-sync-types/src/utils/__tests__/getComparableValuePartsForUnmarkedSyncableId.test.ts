import { describe, it } from 'node:test';

import { makePrefixedTimeIdInfo, makePrefixedUuidInfo, timeIdInfo } from 'freedom-basic-data';
import { expectDeepStrictEqual } from 'freedom-testing-tools';

import { plainId, prefixedTimeId, prefixedUuidId, timeId, uuidId } from '../../types/SyncableId.ts';
import { extractUnmarkedSyncableId } from '../extractUnmarkedSyncableId.ts';
import { getComparableValuePartsForUnmarkedSyncableId } from '../internal/getComparableValuePartsForUnmarkedSyncableId.ts';

const testPrefixedUuidInfo = makePrefixedUuidInfo('TESTUUID_');
const testPrefixedTimeIdInfo = makePrefixedTimeIdInfo('TESTTIMEID_');

describe('getComparableValuePartsForUnmarkedSyncableId', () => {
  it('should work', () => {
    expectDeepStrictEqual(getComparableValuePartsForUnmarkedSyncableId(extractUnmarkedSyncableId(plainId('file', 'hello'))), {
      string: 'hello',
      numeric: 0,
      timeMSec: 0
    });

    expectDeepStrictEqual(getComparableValuePartsForUnmarkedSyncableId(extractUnmarkedSyncableId(plainId('folder', 'world'))), {
      string: 'world',
      numeric: 0,
      timeMSec: 0
    });

    expectDeepStrictEqual(getComparableValuePartsForUnmarkedSyncableId(extractUnmarkedSyncableId(plainId('bundle', '2025'))), {
      string: '',
      numeric: 2025,
      timeMSec: 0
    });

    expectDeepStrictEqual(getComparableValuePartsForUnmarkedSyncableId(extractUnmarkedSyncableId(plainId('file', '3'))), {
      string: '',
      numeric: 3,
      timeMSec: 0
    });

    expectDeepStrictEqual(
      getComparableValuePartsForUnmarkedSyncableId(extractUnmarkedSyncableId(uuidId('file', '5611E363-509E-4BB4-B34B-63BB31FD4DB3'))),
      {
        string: '5611E363-509E-4BB4-B34B-63BB31FD4DB3',
        numeric: 0,
        timeMSec: 0
      }
    );

    expectDeepStrictEqual(
      getComparableValuePartsForUnmarkedSyncableId(
        extractUnmarkedSyncableId(prefixedUuidId('file', testPrefixedUuidInfo.make('D75FBE32-A201-4E3D-BC4C-8F4129F3E312')))
      ),
      {
        string: 'D75FBE32-A201-4E3D-BC4C-8F4129F3E312',
        numeric: 0,
        timeMSec: 0
      }
    );

    expectDeepStrictEqual(
      getComparableValuePartsForUnmarkedSyncableId(
        extractUnmarkedSyncableId(timeId('file', timeIdInfo.make('2024-01-01T01:23:45.678Z-01234567-00ab-cdef-0123-456789abcdef')))
      ),
      {
        string: '01234567-00ab-cdef-0123-456789abcdef',
        numeric: 0,
        timeMSec: 1704072225678
      }
    );

    expectDeepStrictEqual(
      getComparableValuePartsForUnmarkedSyncableId(
        extractUnmarkedSyncableId(
          prefixedTimeId('file', testPrefixedTimeIdInfo.make('2025-02-01T00:23:45.678Z-01234567-89ab-bdef-0123-456789abcdef'))
        )
      ),
      {
        string: '01234567-89ab-bdef-0123-456789abcdef',
        numeric: 0,
        timeMSec: 1738369425678
      }
    );
  });
});
