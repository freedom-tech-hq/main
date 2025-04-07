export class SmtpPublicError extends Error {
  constructor(
    public readonly responseCode: number,
    message: string
  ) {
    super(message);
  }
}
