import type { Theme } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

export type AppTheme = Theme;

export const AppThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme = useMemo(() => {
    const documentStyle = window.getComputedStyle(document.body);

    const defaultFontFamily = documentStyle.getPropertyValue('--default-font-family');
    const h1FontSize = documentStyle.getPropertyValue('--h1-font-size');
    const h1LineHeight = documentStyle.getPropertyValue('--h1-line-height');
    const h2FontSize = documentStyle.getPropertyValue('--h2-font-size');
    const h2LineHeight = documentStyle.getPropertyValue('--h2-line-height');
    const h3FontSize = documentStyle.getPropertyValue('--h3-font-size');
    const h3LineHeight = documentStyle.getPropertyValue('--h3-line-height');
    const body1FontSize = documentStyle.getPropertyValue('--body1-font-size');
    const body1LineHeight = documentStyle.getPropertyValue('--body1-line-height');
    const body2FontSize = documentStyle.getPropertyValue('--body2-font-size');
    const body2LineHeight = documentStyle.getPropertyValue('--body2-line-height');
    const captionFontSize = documentStyle.getPropertyValue('--caption-font-size');
    const captionLineHeight = documentStyle.getPropertyValue('--caption-line-height');
    const buttonFontSize = documentStyle.getPropertyValue('--button-font-size');
    const buttonLineHeight = documentStyle.getPropertyValue('--button-line-height');
    const buttonFontWeight = documentStyle.getPropertyValue('--button-font-weight');
    const inputFontSize = documentStyle.getPropertyValue('--input-font-size');
    const inputLineHeight = documentStyle.getPropertyValue('--input-line-height');
    const inputLabelFontSize = documentStyle.getPropertyValue('--input-label-font-size');
    const inputLabelLineHeight = documentStyle.getPropertyValue('--input-label-line-height');

    const defaultTextColor = documentStyle.getPropertyValue('--colors-default-text');
    const secondaryTextColor = documentStyle.getPropertyValue('--colors-secondary-text');
    const disabledTextColor = documentStyle.getPropertyValue('--colors-disabled-text');

    const colorsBackground = documentStyle.getPropertyValue('--colors-background');
    const colorsAccent = documentStyle.getPropertyValue('--colors-accent');
    const colorsPrimary = documentStyle.getPropertyValue('--colors-primary');
    const colorsPrimaryContrast = documentStyle.getPropertyValue('--colors-primary-contrast');
    const colorsInputBorder = documentStyle.getPropertyValue('--colors-input-border');
    const colorsDivider = documentStyle.getPropertyValue('--colors-divider');

    const theme = createTheme({
      breakpoints: { values: { xs: 0, sm: 320, md: 375, lg: 768, xl: 1440 } },
      typography: {
        fontFamily: defaultFontFamily,
        h1: {
          fontSize: h1FontSize,
          lineHeight: h1LineHeight
        },
        h2: {
          fontSize: h2FontSize,
          lineHeight: h2LineHeight
        },
        h3: {
          fontSize: h3FontSize,
          lineHeight: h3LineHeight
        },
        // h4, h5, h6 are set to the same size as h3
        h4: {
          fontSize: h3FontSize,
          lineHeight: h3LineHeight
        },
        h5: {
          fontSize: h3FontSize,
          lineHeight: h3LineHeight
        },
        h6: {
          fontSize: h3FontSize,
          lineHeight: h3LineHeight
        },
        body1: {
          fontSize: body1FontSize,
          lineHeight: body1LineHeight
        },
        body2: {
          fontSize: body2FontSize,
          lineHeight: body2LineHeight
        },
        caption: {
          fontSize: captionFontSize,
          lineHeight: captionLineHeight
        },
        button: {
          fontSize: buttonFontSize,
          lineHeight: buttonLineHeight,
          fontWeight: buttonFontWeight
        }
      },
      palette: {
        action: {
          disabledBackground: ''
        },
        background: {
          default: colorsBackground
        },
        divider: colorsDivider,
        primary: {
          main: colorsPrimary,
          contrastText: colorsPrimaryContrast
        },
        text: {
          primary: defaultTextColor,
          secondary: secondaryTextColor,
          disabled: disabledTextColor
        }
      },
      components: {
        MuiButton: {
          defaultProps: {
            disableElevation: true
          },
          styleOverrides: {
            startIcon: {
              margin: '0 8px 0 0'
            },
            root: {
              borderRadius: '12px',
              fontSize: buttonFontSize,
              lineHeight: buttonLineHeight,
              fontWeight: buttonFontWeight,
              padding: '8px 16px',
              textTransform: 'none'
            }
          }
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: '8px'
            },
            label: {
              padding: '2px 4px',
              fontSize: inputFontSize,
              lineHeight: inputLineHeight
            }
          }
        },
        MuiFormControl: {
          styleOverrides: {
            root: {
              margin: 0
            }
          }
        },
        MuiFormHelperText: {
          styleOverrides: {
            root: {
              fontSize: inputFontSize,
              lineHeight: inputLineHeight,
              margin: 0,
              marginTop: '4px'
            }
          }
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              borderRadius: '12px',
              padding: '4px 12px'
            },
            input: {
              fontSize: inputFontSize,
              lineHeight: inputLineHeight
            }
          }
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              '&.outside': {
                fontSize: inputLabelFontSize,
                lineHeight: inputLabelLineHeight,
                marginBottom: '8px'
              }
            }
          }
        },
        MuiListItemButton: {
          defaultProps: {
            disableRipple: true,
            disableTouchRipple: true,
            tabIndex: -1
          }
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: '12px',

              '& fieldset': {
                borderColor: colorsInputBorder
              }
            },
            input: {
              padding: '3px 0'
            }
          }
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              color: defaultTextColor,
              borderRadius: '8px',
              padding: '6px 12px',
              backgroundColor: colorsAccent,
              fontSize: captionFontSize,
              lineHeight: captionLineHeight
            }
          }
        }
      }
    });
    const appTheme = theme as AppTheme;

    return appTheme;
  }, []);

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange={true}>
      {children}
    </ThemeProvider>
  );
};
