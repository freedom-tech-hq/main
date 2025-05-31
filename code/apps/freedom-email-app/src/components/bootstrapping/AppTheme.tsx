import type { Theme } from '@mui/material/styles';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

export type AppTheme = Theme;

export const AppThemeProvider = ({ children }: { children?: ReactNode }) => {
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
    const smallestFontSize = documentStyle.getPropertyValue('--smallest-font-size');
    const smallestLineHeight = documentStyle.getPropertyValue('--smallest-line-height');

    const defaultTextColor = documentStyle.getPropertyValue('--colors-default-text');
    const secondaryTextColor = documentStyle.getPropertyValue('--colors-secondary-text');
    const disabledTextColor = documentStyle.getPropertyValue('--colors-disabled-text');

    const semiboldFontWeight = documentStyle.getPropertyValue('--font-weight-semibold');

    const colorsBackground = documentStyle.getPropertyValue('--colors-background');
    const colorsDefaultTextContrast = documentStyle.getPropertyValue('--colors-default-text-contrast');
    const colorsPrimary = documentStyle.getPropertyValue('--colors-primary');
    const colorsPrimaryContrast = documentStyle.getPropertyValue('--colors-primary-contrast');
    const colorsSecondary = documentStyle.getPropertyValue('--colors-secondary');
    const colorsSecondaryContrast = documentStyle.getPropertyValue('--colors-secondary-contrast');
    const colorsInputBorder = documentStyle.getPropertyValue('--colors-input-border');
    const colorsDivider = documentStyle.getPropertyValue('--colors-divider');
    const colorsSuccess = documentStyle.getPropertyValue('--colors-success');

    const stdTheme = createTheme({});
    const sp = (multiple: number) => stdTheme.spacing(multiple);
    const br = (multiple: number) => `${stdTheme.shape.borderRadius * multiple}px`;

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
        secondary: {
          main: colorsSecondary,
          contrastText: colorsSecondaryContrast
        },
        text: {
          primary: defaultTextColor,
          secondary: secondaryTextColor,
          disabled: disabledTextColor
        }
      },
      components: {
        MuiAvatar: {
          styleOverrides: {
            root: {
              borderRadius: br(3),
              fontSize: body1FontSize,
              fontWeight: semiboldFontWeight,
              lineHeight: '100%',

              '&.AvatarPlaceholder': {
                backgroundColor: colorsInputBorder
              },
              '&.md-avatar': {
                width: '32px',
                height: '32px'
              }
            }
          }
        },
        MuiButton: {
          defaultProps: {
            disableElevation: true
          },
          styleOverrides: {
            endIcon: {
              margin: `0 0 0 ${sp(1)}`
            },
            startIcon: {
              margin: `0 ${sp(1)} 0 0`
            },
            root: {
              borderRadius: br(3),
              fontSize: buttonFontSize,
              lineHeight: buttonLineHeight,
              fontWeight: buttonFontWeight,
              padding: `${sp(1)} ${sp(2)}`,
              minWidth: 'auto',
              textTransform: 'none',

              '&.AttachmentButton': {
                borderColor: colorsInputBorder,
                paddingTop: sp(1.5),
                alignItems: 'flex-start'
              }
            }
          }
        },
        MuiCheckbox: {
          styleOverrides: {
            root: {
              borderRadius: br(1),
              border: `1px solid ${colorsInputBorder}`,
              width: '16px',
              height: '16px',

              '&.Mui-checked, &.MuiCheckbox-indeterminate': {
                borderColor: colorsPrimary,
                backgroundColor: colorsPrimary
              },

              '&.ControlledCheckboxPlaceholder': {
                backgroundColor: colorsInputBorder
              }
            }
          }
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: br(2),
              height: 'auto',

              '&.mail-collection-list-item-chip-selected': {
                borderRadius: br(1.5),
                backgroundColor: defaultTextColor,
                minWidth: `calc(${smallestLineHeight} + 2px)`,
                textAlign: 'center',

                '& .MuiChip-label': {
                  padding: `1px ${sp(0.5)}`,
                  color: colorsDefaultTextContrast,
                  fontSize: smallestFontSize,
                  lineHeight: smallestLineHeight
                }
              },

              '&.mail-collection-list-item-chip-not-selected': {
                borderRadius: br(1.5),
                backgroundColor: 'transparent',
                minWidth: `calc(${smallestLineHeight} + 2px)`,
                textAlign: 'center',

                '& .MuiChip-label': {
                  padding: `1px ${sp(0.5)}`,
                  fontSize: smallestFontSize,
                  lineHeight: smallestLineHeight
                }
              },

              '&.AttachmentCountChip': {
                padding: '6px 10px',
                borderRadius: '15px',
                backgroundColor: colorsBackground,

                '& .MuiChip-icon': {
                  marginRight: sp(1)
                },

                '& .MuiChip-label': {
                  fontSize: captionFontSize,
                  lineHeight: '100%'
                }
              }
            },
            icon: {
              margin: `0 ${sp(0.5)} 0 0`
            },
            label: {
              padding: `${sp(0.25)} ${sp(0.5)}`,
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
        MuiFormControlLabel: {
          styleOverrides: {
            root: {
              gap: sp(1),
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
              marginTop: sp(0.5)
            }
          }
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              borderRadius: br(3),
              padding: `${sp(0.5)} ${sp(1.5)}`
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
                marginBottom: sp(1)
              }
            }
          }
        },
        MuiListItemAvatar: {
          styleOverrides: {
            root: {
              minWidth: 'auto'
            }
          }
        },
        MuiListItemButton: {
          defaultProps: {
            disableRipple: true,
            disableTouchRipple: true,
            tabIndex: -1
          },
          styleOverrides: {
            root: {
              '&.mail-collection-list-item': {
                borderRadius: br(3),
                padding: sp(1.5),

                '& .MuiListItemIcon-root': {
                  minWidth: 'auto',
                  marginRight: sp(1)
                }
              },
              '&.mail-thread-list-item': {
                borderRadius: br(4),
                padding: `${sp(2)} ${sp(1.5)}`,
                alignItems: 'flex-start',

                '& .MuiAvatar-root': {
                  marginRight: sp(1)
                }
              }
            }
          }
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              borderRadius: br(3),

              ':is(&, &.Mui-disabled, &.Mui-disabled.MuiOutlinedInput-notchedOutline) fieldset': {
                borderColor: colorsInputBorder
              }
            },
            input: {
              padding: '3px 0'
            }
          }
        },
        MuiSnackbar: {
          styleOverrides: {
            root: {
              '& .MuiPaper-root': {
                backgroundColor: colorsBackground,
                border: `1px solid ${colorsInputBorder}`,
                borderRadius: br(3),
                padding: `${sp(1.5)} ${sp(2)}`,
                justifyContent: 'space-between',
                gap: sp(1)
              }
            }
          }
        },
        MuiSnackbarContent: {
          styleOverrides: {
            action: {
              margin: 0,
              padding: 0,

              '& .MuiButton-root': {
                borderRadius: br(3),
                border: `1px solid ${colorsInputBorder}`,
                padding: `${sp(1)} ${sp(2)}`
              }
            },
            message: {
              color: defaultTextColor,
              fontSize: inputFontSize,
              lineHeight: inputLineHeight
            }
          }
        },
        MuiSvgIcon: {
          styleOverrides: {
            root: {
              '&.IconPlaceholder': {
                backgroundColor: colorsInputBorder,
                borderRadius: br(1)
              }
            }
          }
        },
        MuiSwitch: {
          styleOverrides: {
            root: {
              width: 42,
              height: 26,
              padding: 0,
              '& .MuiSwitch-switchBase': {
                padding: 0,
                margin: 2,
                transitionDuration: '300ms',
                '&.Mui-checked': {
                  transform: 'translateX(16px)',
                  color: '#fff',
                  '& + .MuiSwitch-track': {
                    backgroundColor: colorsSuccess,
                    opacity: 1,
                    border: 0
                  },
                  '&.Mui-disabled + .MuiSwitch-track': {
                    opacity: 0.5
                  }
                },
                '&.Mui-focusVisible .MuiSwitch-thumb': {
                  color: '#33cf4d',
                  border: '6px solid #fff'
                },
                '&.Mui-disabled .MuiSwitch-thumb': {
                  color: colorsSecondary
                },
                '&.Mui-disabled + .MuiSwitch-track': {
                  opacity: 0.7
                }
              },
              '& .MuiSwitch-thumb': {
                boxSizing: 'border-box',
                width: 22,
                height: 22
              },
              '& .MuiSwitch-track': {
                borderRadius: 26 / 2,
                backgroundColor: colorsInputBorder,
                opacity: 1,
                transition: 'background-color 500ms ease-in-out'
              },
              '&.ControlledSwitchPlaceholder': {
                '& .MuiSwitch-switchBase': {
                  backgroundColor: colorsInputBorder,

                  '& .MuiSwitch-thumb': {
                    display: 'none'
                  }
                }
              }
            }
          }
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '&.ControlledTextFieldPlaceholder': {
                '& fieldset': {
                  backgroundColor: colorsInputBorder
                }
              }
            }
          }
        },
        MuiTooltip: {
          styleOverrides: {
            tooltip: {
              color: defaultTextColor,
              borderRadius: br(2),
              padding: `${sp(0.75)} ${sp(1.5)}`,
              backgroundColor: colorsSecondary,
              fontSize: captionFontSize,
              lineHeight: captionLineHeight
            }
          }
        },
        MuiTypography: {
          styleOverrides: {
            root: {
              '&.TxtPlaceholder': {
                position: 'relative',

                '& .indicator': {
                  borderRadius: br(1.5),
                  backgroundColor: colorsInputBorder,
                  display: 'block',
                  position: 'absolute',
                  top: 2,
                  right: 0,
                  bottom: 2,
                  left: 0
                },
                '& span:not(.indicator, .space)': {
                  color: 'transparent'
                },
                '&.empty': {
                  color: 'transparent'
                }
              }
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
