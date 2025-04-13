import type { ReactNode } from 'react';

import type { ElseExpression } from '../types/ElseExpression.ts';

export const ELSE = (render: () => ReactNode): ElseExpression => ({ else: render });
