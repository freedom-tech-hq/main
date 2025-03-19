import { get as safeGet } from 'lodash-es';

import { safeParse } from './safeParse.ts';

// Example of parsed `He'l"l\`o `:
// {
//   "type": "Program",
//   "body": [
//     {
//       "type": "ExpressionStatement",
//       "expression": {
//         "type": "TemplateLiteral",
//         "quasis": [
//           {
//             "type": "TemplateElement",
//             "value": {
//               "raw": "He'l\"l\\`o ",
//               "cooked": "He'l\"l`o "
//             },
//             "tail": true
//           }
//         ],
//         "expressions": []
//       }
//     }
//   ],
//   "sourceType": "script"
// }

export const parseTemplateString = (value: string) =>
  (safeGet(safeParse(value), 'body.0.expression.quasis.0.value.cooked') ?? '') as string;
