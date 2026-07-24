/**
 * Shiki themes built from the Lyra palette (tokens/colors.css) so code panels
 * feel native to the design system in both light and dark. Emitted as CSS
 * variables (defaultColor:false); site.css swaps the set on [data-theme] and
 * paints the panel with Lyra surface tokens.
 *
 * Shared on purpose: `source.config.ts` highlights MDX fences with these, and
 * `lib/highlight-source.ts` highlights extracted example sources with the same
 * pair, so both code panels are indistinguishable.
 */
export const lyraLight = {
  name: 'lyra-light',
  type: 'light',
  colors: { 'editor.background': '#F1F5F9', 'editor.foreground': '#0F172A' },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#64748B', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control'],
      settings: { foreground: '#4A48B8' },
    },
    {
      scope: ['string', 'string.template', 'punctuation.definition.string'],
      settings: { foreground: '#15803D' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#5B5BD6' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'support.constant'],
      settings: { foreground: '#B45309' },
    },
    {
      scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
      settings: { foreground: '#3D3C94' },
    },
    { scope: ['entity.name.tag'], settings: { foreground: '#4A48B8' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#5B5BD6' } },
    {
      scope: ['variable', 'variable.parameter', 'meta.object-literal.key'],
      settings: { foreground: '#0F172A' },
    },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#475569' } },
  ],
} as const;

export const lyraDark = {
  name: 'lyra-dark',
  type: 'dark',
  colors: { 'editor.background': '#0B0D1D', 'editor.foreground': '#C3C8E8' },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#6C739E', fontStyle: 'italic' },
    },
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.control'],
      settings: { foreground: '#A5A7EE' },
    },
    {
      scope: ['string', 'string.template', 'punctuation.definition.string'],
      settings: { foreground: '#4ADE80' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#8285E4' },
    },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'support.constant'],
      settings: { foreground: '#FBBF24' },
    },
    {
      scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class'],
      settings: { foreground: '#C6C8F5' },
    },
    { scope: ['entity.name.tag'], settings: { foreground: '#A5A7EE' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#8285E4' } },
    {
      scope: ['variable', 'variable.parameter', 'meta.object-literal.key'],
      settings: { foreground: '#C3C8E8' },
    },
    { scope: ['punctuation', 'meta.brace'], settings: { foreground: '#9AA1C9' } },
  ],
} as const;
