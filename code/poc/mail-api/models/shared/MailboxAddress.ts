/** Single mailbox item as “Display Name <address>”. */
export interface MailboxAddress {
  /** Optional human-friendly name */
  name?: string;
  /** RFC 5322 addr-spec */
  address: string;
}
