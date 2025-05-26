/** Many-to-many join between Message and Label. */
export interface MessageLabel {
  /** Message foreign key */
  messageId: string;
  /** Label foreign key */
  labelId: string;
}
