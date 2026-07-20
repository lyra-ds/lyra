import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import { iconRegistry, type IconName } from './icon-registry';
import { cx } from '../internal/cx';

// Module-scoped ambient for the dev-only warning below (same convention as internal/
// use-controllable-state.ts). `@lyra-ds/react` is a browser package with no `@types/node`;
// declaring `process` narrowly keeps typecheck strict. Bundlers replace `process.env.NODE_ENV`
// at build, so the warning is dropped from production output (D-05).
declare const process: { env: { NODE_ENV?: string } };

export type { IconName };

/**
 * Props for {@link Icon}. A `name` from the curated registry is the common path; the `icon`
 * escape hatch (D-03) accepts any lucide-react component for glyphs outside the registry.
 */
export interface IconProps {
  /** Curated registry key in kebab-case, e.g. `"arrow-right"`, `"search"`, `"layout-dashboard"`. */
  name?: IconName;
  /** Escape hatch (D-03): a lucide-react component. Wins over `name` when both are given. */
  icon?: LucideIcon;
  /** Side length in px. Default `20` (16 inline, 24 for emphasis). */
  size?: number;
  /** CSS color. Defaults to `currentColor` (lucide's native default — D-06). */
  color?: string;
  /** Accessible label. With it the icon is `role="img"`; without it the icon is decorative. */
  title?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Lyra DS icon — renders a Lucide glyph from the curated, tree-shakable registry (RCT-05,
 * no CDN) or from the `icon` escape hatch. Color is inherited via `currentColor` (D-06).
 *
 * The `.lyra-icon` class is ALWAYS emitted. This is a deliberate class-API extension over the
 * handoff prototype (which forwarded only the consumer `className`): D-06 names the class
 * explicitly as a stable consumer/test hook. No CSS rule ships for `.lyra-icon` in
 * `@lyra-ds/styles` — it exists purely as a targeting handle (recorded in CONVENTIONS.md, 03-08).
 *
 * Accessible naming for an icon-only interactive parent (e.g. an icon-only Button) is
 * CONSUMER-enforced — pass `title` here or an `aria-label` on the parent. Icon makes no
 * API guarantee about the parent's accessible name; this is guidance, not enforcement.
 *
 * @example
 * <Icon name="check" />                       // decorative, currentColor, 20px
 * <Icon name="settings" title="Settings" />   // role="img", aria-label="Settings"
 * <Icon icon={SomeLucideIcon} />              // escape hatch for a non-registry glyph
 */
export const Icon = /*#__PURE__*/ forwardRef<SVGSVGElement, IconProps>(function Icon(
  { name, icon, size = 20, color, title, className, style },
  ref,
) {
  // Resolve: escape hatch first, else a frozen-map key lookup guarded by Object.hasOwn so
  // prototype-chain keys (`constructor`, `toString`, …) never resolve to a function (V5 hygiene).
  const Comp =
    icon ??
    (name !== undefined && Object.hasOwn(iconRegistry, name) ? iconRegistry[name] : undefined);

  if (!Comp) {
    // Dev-only warning; stripped from production builds via the NODE_ENV guard (D-05). Only a
    // genuinely-provided-but-unknown `name` warns — a bare `<Icon />` is a silent decorative no-op.
    if (name !== undefined && process.env.NODE_ENV !== 'production') {
      console.warn(
        `[lyra-ds] Icon: unknown name "${name}". It is not in the curated registry — pass a lucide-react component via the \`icon\` prop instead.`,
      );
    }
    return null;
  }

  return (
    <Comp
      ref={ref}
      className={cx('lyra-icon', className)}
      size={size}
      color={color}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={style}
    />
  );
});
