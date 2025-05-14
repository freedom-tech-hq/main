import { describe, it } from 'node:test';

import { makePrefixedTimeIdInfo, makePrefixedUuidInfo, timeIdInfo } from 'freedom-basic-data';
import { expectDeepStrictEqual } from 'freedom-testing-tools';

import type { SyncableId } from '../../types/SyncableId.ts';
import { plainId, prefixedTimeId, prefixedUuidId, timeId, uuidId } from '../../types/SyncableId.ts';
import { syncableIdComparator } from '../syncableIdComparator.ts';

const testPrefixedUuidInfo = makePrefixedUuidInfo('TESTUUID_');
const testPrefixedTimeIdInfo = makePrefixedTimeIdInfo('TESTTIMEID_');

describe('syncableIdComparator', () => {
  it('should work', () => {
    const ids: SyncableId[] = [
      plainId('file', 'hello'),
      plainId('file', 'world'),
      plainId('folder', 'world'),
      plainId('folder', 'hello'),
      plainId('bundle', '5'),
      plainId('bundle', '1'),
      plainId('bundle', '3'),
      plainId('bundle', '2025'),
      plainId('file', '4'),
      plainId('file', '6'),
      plainId('file', '3'),
      uuidId('file', '736AE65D-C67D-4E0E-983C-F9298943C517'),
      uuidId('file', '5611E363-509E-4BB4-B34B-63BB31FD4DB3'),
      prefixedUuidId('file', testPrefixedUuidInfo.make('873522C0-D243-4176-8FB6-BD3B6864480D')),
      prefixedUuidId('file', testPrefixedUuidInfo.make('D75FBE32-A201-4E3D-BC4C-8F4129F3E312')),
      timeId('file', timeIdInfo.make('2025-01-01T01:23:45.678Z-01234567-89ab-cdef-0123-456789abcdef')),
      timeId('file', timeIdInfo.make('2024-01-01T01:23:45.678Z-01234567-00ab-cdef-0123-456789abcdef')),
      prefixedTimeId('file', testPrefixedTimeIdInfo.make('2025-02-01T01:23:45.678Z-01234567-89ab-adef-0123-456789abcdef')),
      prefixedTimeId('file', testPrefixedTimeIdInfo.make('2025-02-01T00:23:45.678Z-01234567-89ab-bdef-0123-456789abcdef'))
    ];
    const sortedIds = ids.sort(syncableIdComparator);

    expectDeepStrictEqual(sortedIds, [
      'EyTb._2025',
      'EyTb._5',
      'EyTb._3',
      'EyTb._1',
      'EyTf._6',
      'EyTf._4',
      'EyTf._3',
      'EyTf5611E363-509E-4BB4-B34B-63BB31FD4DB3',
      'EyTf736AE65D-C67D-4E0E-983C-F9298943C517',
      'EyTfTESTUUID_873522C0-D243-4176-8FB6-BD3B6864480D',
      'EyTfTESTUUID_D75FBE32-A201-4E3D-BC4C-8F4129F3E312',
      'EyTf._hello',
      'EyTf._world',
      'EyTfT_2024-01-01T01:23:45.678Z-01234567-00ab-cdef-0123-456789abcdef',
      'EyTfT_2025-01-01T01:23:45.678Z-01234567-89ab-cdef-0123-456789abcdef',
      'EyTfTESTTIMEID_2025-02-01T00:23:45.678Z-01234567-89ab-bdef-0123-456789abcdef',
      'EyTfTESTTIMEID_2025-02-01T01:23:45.678Z-01234567-89ab-adef-0123-456789abcdef',
      'EyTF._hello',
      'EyTF._world'
    ]);
  });
});
