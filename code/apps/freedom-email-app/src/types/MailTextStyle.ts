import { makeStringSubtypeArray } from 'yaschema';

export const mailTextStyles = makeStringSubtypeArray(
  'normal',
  'heading1',
  'heading2',
  'heading3',
  'heading4',
  'heading5',
  'heading6',
  'blockquote',
  'code'
);
export type MailTextStyle = (typeof mailTextStyles)[0];
