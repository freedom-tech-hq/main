import type { DevLoggingSupport } from '../types/DevLoggingSupport.ts';

export const makeDevLoggingSupport = <LogEntryT>(initialShouldRecordLogs: boolean): DevLoggingSupport<LogEntryT> => {
  let shouldRecordLogs = false;

  DEV: shouldRecordLogs = initialShouldRecordLogs;

  const logEntries: LogEntryT[] = [];

  const appendLogEntry = (logEntry: LogEntryT) => logEntries.push(logEntry);

  const output: DevLoggingSupport<LogEntryT> & { appendLogEntry: ((entry: LogEntryT) => void) | undefined } = {
    setShouldRecordLogs: (shouldRecord) => {
      DEV: {
        shouldRecordLogs = shouldRecord;

        output.appendLogEntry = shouldRecord ? appendLogEntry : undefined;
      }
    },

    isRecordingLogs: () => shouldRecordLogs,

    appendLogEntry: shouldRecordLogs ? appendLogEntry : undefined,

    getLogEntries: () => {
      return [...logEntries];
    },

    clearLogEntries: () => {
      logEntries.length = 0;
    }
  };

  return output;
};
