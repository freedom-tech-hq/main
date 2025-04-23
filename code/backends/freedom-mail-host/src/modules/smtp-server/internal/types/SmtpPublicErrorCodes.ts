export type SmtpPublicErrorCodes =
  | 'forbidden'
  | 'invalid-credentials'
  | 'malformed-email-address'
  | 'message-too-long'
  | 'user-not-found'
  | 'relay-denied'
  | 'stream-error'
  | 'require-tls';
