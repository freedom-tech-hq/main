import type { TypographyProps } from '@mui/material';
import { Typography } from '@mui/material';
import { makeStringSubtypeArray } from 'yaschema';

export const tVariants = makeStringSubtypeArray(
  'h1-accent-title',
  'h2-semibold',
  'h2-regular',
  'h3-semibold',
  'h3-regular',
  'p1-regular',
  'p1-medium',
  'p1-semibold',
  'p2-regular',
  'p2-medium',
  'p2-semibold',
  'c1-regular',
  'c1-medium',
  'c1-semibold',
  'button-medium'
);
export type TVariant = (typeof tVariants)[0];

export const Txt = ({ children, variant, ...props }: Omit<TypographyProps, 'variant'> & { variant: TVariant }) => (
  <Typography {...props} variant={muiVariantByTVariant[variant]} className={`${variant} ${props.className ?? ''}`}>
    {children}
  </Typography>
);

// Helpers

const muiVariantByTVariant: Record<TVariant, TypographyProps['variant']> = {
  'h1-accent-title': 'h1',
  'h2-semibold': 'h2',
  'h2-regular': 'h2',
  'h3-semibold': 'h3',
  'h3-regular': 'h3',
  'p1-regular': 'body1',
  'p1-medium': 'body1',
  'p1-semibold': 'body1',
  'p2-regular': 'body2',
  'p2-medium': 'body2',
  'p2-semibold': 'body2',
  'c1-regular': 'caption',
  'c1-medium': 'caption',
  'c1-semibold': 'caption',
  'button-medium': 'button'
};
