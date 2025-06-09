import { LOCALIZE } from 'freedom-localization';
import { useT } from 'freedom-react-localization';
import React from 'react';

import type { ControlledTextFieldProps } from '../../../../../components/reusable/form/ControlledTextField.tsx';
import { ControlledTextField } from '../../../../../components/reusable/form/ControlledTextField.tsx';

const ns = 'ui';
const $bcc = LOCALIZE('BCC')({ ns });

export type ComposeMailBccFieldProps = ControlledTextFieldProps;

export const ComposeMailBccField = (props: ComposeMailBccFieldProps) => {
  const t = useT();

  return <ControlledTextField label={$bcc(t)} labelPosition="above" helperText="" {...props} />;
};
