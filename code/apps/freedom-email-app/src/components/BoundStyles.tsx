import type { ComponentType, CSSProperties } from 'react';
import React, { useRef } from 'react';
import type { BindingDependencies, DerivedBindingOptions, ReadonlyBinding, UseDerivedBindingTransformer } from 'react-bindings';
import { useBindingEffect, useDerivedBinding } from 'react-bindings';

import { useUuid } from '../hooks/useUuid.ts';

export type BoundStylesProps<ComponentT extends ComponentType> = (ComponentT extends ComponentType<
  infer P extends { id?: string; style?: CSSProperties }
>
  ? P
  : never) & {
  component: ComponentT;
  id?: string;
  style?: CSSProperties;
  dynamicStyle: () => ReadonlyBinding<CSSProperties>;
};

export const BoundStyles = <ComponentT extends ComponentType>({
  component: Component,
  id,
  style,
  dynamicStyle: useDynamicStyle,
  ...props
}: BoundStylesProps<ComponentT>) => {
  const uuid = useUuid();

  const prevStyles = useRef<CSSProperties>({});

  const dynamicStyle = useDynamicStyle();

  useBindingEffect(dynamicStyle, (dynamicStyle) => {
    const elem = document.getElementById(id ?? uuid);
    if (elem === null) {
      return; // Not ready
    }

    setValueForStyles(elem, dynamicStyle, prevStyles.current);

    prevStyles.current = { ...dynamicStyle };
  });

  return <Component {...(props as any)} id={id ?? uuid} style={{ ...style, ...dynamicStyle.get() }} />;
};

export const dynamicStyle = <DependenciesT extends BindingDependencies>(
  bindings: DependenciesT | undefined,
  transformer: UseDerivedBindingTransformer<CSSProperties, DependenciesT>,
  options?: Partial<DerivedBindingOptions<CSSProperties>>
  // eslint-disable-next-line react-hooks/rules-of-hooks
) => ({ dynamicStyle: () => useDerivedBinding(bindings, transformer, { ...options, id: options?.id ?? 'dynamicStyle' }) });

// Helpers

type Indexable = { [key: string | number | symbol]: any };

// Copied from https://github.com/facebook/react/blob/56408a5b12fa4099e9dbbeca7f6bc59e1307e507/packages/react-dom-bindings/src/shared/isUnitlessNumber.js
const unitlessNumbers = new Set([
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'boxFlex',
  'boxFlexGroup',
  'boxOrdinalGroup',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexPositive',
  'flexShrink',
  'flexNegative',
  'flexOrder',
  'gridArea',
  'gridRow',
  'gridRowEnd',
  'gridRowSpan',
  'gridRowStart',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnSpan',
  'gridColumnStart',
  'fontWeight',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
  'fillOpacity', // SVG-related properties
  'floodOpacity',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
  'MozAnimationIterationCount', // Known Prefixed Properties
  'MozBoxFlex', // TODO: Remove these since they shouldn't be used in modern code
  'MozBoxFlexGroup',
  'MozLineClamp',
  'msAnimationIterationCount',
  'msFlex',
  'msZoom',
  'msFlexGrow',
  'msFlexNegative',
  'msFlexOrder',
  'msFlexPositive',
  'msFlexShrink',
  'msGridColumn',
  'msGridColumnSpan',
  'msGridRow',
  'msGridRowSpan',
  'WebkitAnimationIterationCount',
  'WebkitBoxFlex',
  'WebKitBoxFlexGroup',
  'WebkitBoxOrdinalGroup',
  'WebkitColumnCount',
  'WebkitColumns',
  'WebkitFlex',
  'WebkitFlexGrow',
  'WebkitFlexPositive',
  'WebkitFlexShrink',
  'WebkitLineClamp'
]);

// Based on https://github.com/facebook/react/blob/56408a5b12fa4099e9dbbeca7f6bc59e1307e507/packages/react-dom-bindings/src/client/CSSPropertyOperations.js#L68
const setValueForStyle = (style: CSSStyleDeclaration, styleName: string, value: any) => {
  const isCustomProperty = styleName.indexOf('--') === 0;

  if (value === null || typeof value === 'boolean' || value === '') {
    if (isCustomProperty) {
      style.setProperty(styleName, '');
    } else if (styleName === 'float') {
      style.cssFloat = '';
    } else {
      (style as Indexable)[styleName] = '';
    }
  } else if (isCustomProperty) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    style.setProperty(styleName, value);
  } else if (typeof value === 'number' && value !== 0 && !unitlessNumbers.has(styleName)) {
    (style as Indexable)[styleName] = value + 'px'; // Presumes implicit 'px' suffix for unitless numbers
  } else {
    if (styleName === 'float') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      style.cssFloat = value;
    } else {
      (style as Indexable)[styleName] = ('' + value).trim();
    }
  }
};

/* eslint-disable no-prototype-builtins */
// Based on https://github.com/facebook/react/blob/56408a5b12fa4099e9dbbeca7f6bc59e1307e507/packages/react-dom-bindings/src/client/CSSPropertyOperations.js#L111
const setValueForStyles = (node: HTMLElement, styles: CSSProperties, prevStyles: CSSProperties) => {
  const style = node.style;

  for (const styleName in prevStyles) {
    if (prevStyles.hasOwnProperty(styleName) && (styles === null || !styles.hasOwnProperty(styleName))) {
      // Clear style
      const isCustomProperty = styleName.indexOf('--') === 0;
      if (isCustomProperty) {
        style.setProperty(styleName, '');
      } else if (styleName === 'float') {
        style.cssFloat = '';
      } else {
        (style as Indexable)[styleName] = '';
      }
    }
  }

  for (const styleName in styles) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const value = (styles as Indexable)[styleName];
    if (styles.hasOwnProperty(styleName) && (prevStyles as Indexable)[styleName] !== value) {
      setValueForStyle(style, styleName, value);
    }
  }
};
/* eslint-enable no-prototype-builtins */
