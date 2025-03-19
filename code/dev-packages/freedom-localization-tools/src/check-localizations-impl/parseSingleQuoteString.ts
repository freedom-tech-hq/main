import { get as safeGet } from 'lodash-es';

import { safeParse } from './safeParse.ts';

// Example of parsed 'hello'
// {
//   "type": "Program",
//   "body": [
//     {
//       "type": "ExpressionStatement",
//       "directive": "hello",
//       "expression": {
//         "type": "Literal",
//         "value": "hello",
//         "raw": "'hello'"
//       }
//     }
//   ],
//   "sourceType": "script"
// }
export const parseSingleQuoteString = (value: string) => (safeGet(safeParse(value), 'body.0.expression.value') ?? '') as string;
