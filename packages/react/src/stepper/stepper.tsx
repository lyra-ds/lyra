import { forwardRef, Fragment } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** Props for {@link Stepper}. */
export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  /** Step labels, in order. */
  steps: ReactNode[];
  /** Zero-based index of the current step. */
  active: number;
}

/** A presentational multi-step progress indicator. */
export const Stepper = /*#__PURE__*/ forwardRef<HTMLDivElement, StepperProps>(function Stepper(
  { steps, active, className, ...rest },
  ref,
) {
  return (
    <div {...rest} ref={ref} className={cx('lyra-stepper', className)}>
      {steps.map((label, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <span className={cx('lyra-step__line', index <= active && 'lyra-step__line--done')} />
          )}
          <span
            className={cx(
              'lyra-step',
              index === active && 'lyra-step--active',
              index < active && 'lyra-step--done',
            )}
            aria-current={index === active ? 'step' : undefined}
          >
            <span className="lyra-step__dot">
              {index < active ? (
                <svg
                  aria-hidden="true"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span className="lyra-step__label">{label}</span>
          </span>
        </Fragment>
      ))}
    </div>
  );
});
