import {
  extractTimeMSecAndUuidFromPrefixedTimeId,
  extractUuidFromPrefixedUuid,
  isPrefixedTimeId,
  isPrefixedUuid,
  isUuid,
  timeIdInfo
} from 'freedom-basic-data';

import { type UnmarkedSyncableId, unmarkedSyncablePlainIdInfo, unmarkedSyncableSaltedIdInfo } from '../../types/SyncableId.ts';

export const getComparableValuePartsForUnmarkedSyncableId = (
  id: UnmarkedSyncableId
): { timeMSec: number; numeric: number; string: string } => {
  const output: { timeMSec: number; numeric: number; string: string } = { timeMSec: 0, numeric: 0, string: '' };

  if (timeIdInfo.is(id)) {
    output.timeMSec = timeIdInfo.extractTimeMSec(id);
    output.string = timeIdInfo.extractUuid(id);
  } else if (isPrefixedTimeId(id)) {
    const [timeMSec, uuid] = extractTimeMSecAndUuidFromPrefixedTimeId(id);
    output.timeMSec = timeMSec;
    output.string = uuid;
  } else if (isUuid(id)) {
    output.string = id;
  } else if (isPrefixedUuid(id)) {
    output.string = extractUuidFromPrefixedUuid(id);
  } else if (unmarkedSyncablePlainIdInfo.is(id)) {
    const stringValue = unmarkedSyncablePlainIdInfo.removePrefix(id);

    const numericValue = Number(stringValue);
    if (!isNaN(numericValue)) {
      output.numeric = numericValue;
      output.string = '';
    } else {
      output.string = stringValue;
    }
  } else if (unmarkedSyncableSaltedIdInfo.is(id)) {
    output.string = unmarkedSyncableSaltedIdInfo.removePrefix(id);
  }

  return output;
};
