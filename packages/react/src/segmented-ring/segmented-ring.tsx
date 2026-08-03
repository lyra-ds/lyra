import { forwardRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** A named portion of a SegmentedRing. */
export interface RingSegment {
  /** Numeric amount represented by this segment. Non-positive values are not drawn. */
  value: number;
  /** Human-readable name for this segment. */
  label: string;
  /** Semantic segment color. Ignored when color is provided. */
  tone?: 'success' | 'accent' | 'danger' | 'warning' | 'neutral';
  /** Custom CSS color that overrides tone. */
  color?: string;
}

/** Props for SegmentedRing. */
export interface SegmentedRingProps extends HTMLAttributes<HTMLDivElement> {
  /** Named segments that make up the ring. */
  segments?: RingSegment[];
  /** Ring denominator. Defaults to the sum of positive segments. */
  total?: number;
  /** Large value rendered in the center, for example "5 of 8". */
  centerValue?: ReactNode;
  /** Small label rendered below the center value, for example "Sessions". */
  centerLabel?: ReactNode;
  /** Ring diameter. Default: "lg" (160px); "md" is 96px. */
  size?: 'md' | 'lg';
  /** Stacks the legend below the ring. Default: false. */
  stacked?: boolean;
  /** Whether to render the visual legend. Default: true. */
  showLegend?: boolean;
}

const TONE_COLORS = {
  success: 'var(--success)',
  accent: 'var(--accent)',
  danger: 'var(--danger)',
  warning: 'var(--warning)',
  neutral: 'var(--border-strong)',
} as const;

function segmentColor(segment: RingSegment): string {
  return segment.color ?? TONE_COLORS[segment.tone ?? 'neutral'];
}

/**
 * A segmented progress ring for named categories that add up to a total.
 *
 * The SVG, center treatment, and visual legend are deliberately hidden from assistive
 * technology. A single visually-hidden textual equivalent is the component's sole
 * accessible source, so the values are announced once rather than duplicated.
 */
export const SegmentedRing = /*#__PURE__*/ forwardRef<HTMLDivElement, SegmentedRingProps>(
  function SegmentedRing(
    {
      segments = [],
      total,
      centerValue,
      centerLabel,
      size = 'lg',
      stacked = false,
      showLegend = true,
      className,
      ...rest
    },
    ref,
  ) {
    const px = size === 'lg' ? 160 : 96;
    const stroke = size === 'lg' ? 12 : 9;
    const radius = (px - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const visibleSegments = segments.filter(
      (segment) => Number.isFinite(segment.value) && segment.value > 0,
    );
    // Scale against the largest finite segment before summing. This preserves each
    // fraction while avoiding `Number.MAX_VALUE + Number.MAX_VALUE === Infinity`.
    const largestSegment = Math.max(0, ...visibleSegments.map((segment) => segment.value));
    const scaledTotal = visibleSegments.reduce(
      (amount, segment) => amount + segment.value / largestSegment,
      0,
    );
    const scaledDenominator =
      Number.isFinite(total) && total != null && total > 0 ? total / largestSegment : scaledTotal;
    let remaining = 1;
    const boundedSegments = visibleSegments
      .map((segment) => {
        const requestedFraction = segment.value / largestSegment / scaledDenominator;
        // A segment can exceed its declared total. Bound it to the unpainted
        // circumference so dash lengths never become negative or overflow.
        const fraction = Number.isFinite(requestedFraction)
          ? Math.min(Math.max(requestedFraction, 0), remaining)
          : remaining;
        remaining -= fraction;
        return { ...segment, fraction };
      })
      .filter((segment) => segment.fraction > 0);
    const gap = boundedSegments.length > 1 ? 2.5 : 0;
    let accumulated = 0;
    const arcs = boundedSegments.map((segment) => {
      const fraction = segment.fraction;
      const length = Math.max(0, fraction * circumference - gap);
      const arc = {
        ...segment,
        dash: String(length) + ' ' + String(circumference - length),
        offset: -accumulated * circumference + circumference / 4,
      };
      accumulated += fraction;
      return arc;
    });

    return (
      <div
        {...rest}
        ref={ref}
        className={cx(
          'lyra-ring',
          'lyra-ring--' + size,
          stacked && 'lyra-ring--stacked',
          className,
        )}
      >
        <span className="lyra-ring__wrap" aria-hidden="true">
          <svg width={px} height={px} viewBox={'0 0 ' + px + ' ' + px} aria-hidden="true">
            <circle
              cx={px / 2}
              cy={px / 2}
              r={radius}
              fill="none"
              stroke="var(--surface-sunken)"
              strokeWidth={stroke}
            />
            {arcs.map((arc, index) => (
              <circle
                key={arc.label + '-' + index}
                cx={px / 2}
                cy={px / 2}
                r={radius}
                fill="none"
                stroke={segmentColor(arc)}
                strokeWidth={stroke}
                strokeLinecap={gap ? 'round' : 'butt'}
                strokeDasharray={arc.dash}
                strokeDashoffset={arc.offset}
              />
            ))}
          </svg>
          <span className="lyra-ring__center">
            {centerValue != null && <span className="lyra-ring__num">{centerValue}</span>}
            {centerLabel != null && <span className="lyra-ring__cap">{centerLabel}</span>}
          </span>
        </span>

        <span className="lyra-visually-hidden">
          {centerValue != null && (
            <>
              {centerLabel != null && <>{centerLabel} </>}
              {centerValue} —{' '}
            </>
          )}
          {visibleSegments.map((segment, index) => (
            <span key={segment.label + '-' + index}>
              {index > 0 && ', '}
              {segment.value} {segment.label}
            </span>
          ))}
        </span>

        {showLegend && (
          <ul className="lyra-ring__legend" aria-hidden="true">
            {segments.map((segment, index) => (
              <li key={segment.label + '-' + index} className="lyra-ring__li">
                <span
                  className="lyra-ring__swatch"
                  style={{ backgroundColor: segmentColor(segment) } satisfies CSSProperties}
                />
                <span>{segment.label}</span>
                <span className="lyra-ring__val">{segment.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
