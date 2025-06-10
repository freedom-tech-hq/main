import type { IOptions } from 'sanitize-html';

export const sanitizeHtmlOptions: IOptions = {
  allowedTags: [
    'body',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'div',
    'span',
    'p',
    'br',
    'hr',
    'b',
    'strong',
    'i',
    'em',
    'u',
    'a',
    'img',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'font',
    'center'
  ],
  allowedAttributes: {
    '*': ['style', 'align', 'valign'],
    a: ['href', 'name', 'target'],
    img: ['src', 'alt', 'width', 'height', 'border', 'style'],
    table: ['width', 'height', 'border', 'cellpadding', 'cellspacing', 'bgcolor', 'align'],
    td: ['width', 'height', 'colspan', 'rowspan', 'bgcolor', 'align', 'valign'],
    tr: ['bgcolor', 'align', 'valign'],
    th: ['width', 'height', 'colspan', 'rowspan', 'bgcolor', 'align', 'valign'],
    font: ['face', 'size', 'color']
  },
  allowedStyles: {
    '*': {
      // Box model
      width: [/^[\d.]+(px|%)$/],
      height: [/^[\d.]+(px|%)$/],
      padding: [/^[\d.]+(px|%)$/],
      'padding-top': [/^[\d.]+(px|%)$/],
      'padding-right': [/^[\d.]+(px|%)$/],
      'padding-bottom': [/^[\d.]+(px|%)$/],
      'padding-left': [/^[\d.]+(px|%)$/],
      margin: [/^[\d.]+(px|%)$/],
      'margin-top': [/^[\d.]+(px|%)$/],
      'margin-bottom': [/^[\d.]+(px|%)$/],
      border: [/^[\d.]+px\s+(solid|dotted|dashed)\s+#[0-9a-fA-F]{3,6}$/],
      'border-width': [/^[\d.]+px$/],
      'border-style': [/^(solid|dotted|dashed|none)$/],
      'border-color': [/^#[0-9a-fA-F]{3,6}$/],

      // Typography
      color: [/^#[0-9a-fA-F]{3,6}$/],
      'background-color': [/^#[0-9a-fA-F]{3,6}$/],
      'font-family': [/^[a-zA-Z0-9\s'",-]+$/],
      'font-size': [/^[\d.]+(px|pt|em|%)$/],
      'font-weight': [/^(normal|bold|[1-9]00)$/],
      'font-style': [/^(normal|italic|oblique)$/],
      'text-decoration': [/^(none|underline|overline|line-through)$/],
      'text-align': [/^(left|right|center|justify)$/],
      'vertical-align': [/^(top|middle|bottom|baseline)$/],
      'line-height': [/^[\d.]+(px|%)?$/],
      'letter-spacing': [/^[\d.]+(px|em)?$/],
      'text-transform': [/^(uppercase|lowercase|capitalize|none)$/],

      // Images
      display: [/^(inline|block|inline-block)$/],
      'max-width': [/^[\d.]+(px|%)$/]
    }
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'mailto', 'tel', 'data']
  },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, target: '_blank' } }),
    body: (_tagName, _attribs) => ({ tagName: 'div', attribs: {} })
  }
};
