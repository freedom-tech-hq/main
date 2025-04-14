export interface DevLoggingSupport<LogEntryT> {
  readonly setShouldRecordLogs: (shouldRecord: boolean) => void;
  readonly isRecordingLogs: () => boolean;
  readonly appendLogEntry: ((entry: LogEntryT) => void) | undefined;
  readonly getLogEntries: () => LogEntryT[];
  readonly clearLogEntries: () => void;
}
