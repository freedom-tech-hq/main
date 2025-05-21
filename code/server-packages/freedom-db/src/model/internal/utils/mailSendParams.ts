export const SENT_SUBDIR = 'sent';

export const sanitizeIdForFilename = (id: string): string => id.replaceAll('/', '`');
