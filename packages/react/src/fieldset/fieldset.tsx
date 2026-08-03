import { Children, forwardRef } from 'react';
import type { CSSProperties, FieldsetHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

type FormRowStyle = CSSProperties & {
  '--lyra-formrow-columns'?: string;
};

/** Props for {@link Fieldset}. */
export interface FieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /** Legend rendered for the semantic fieldset. */
  legend?: ReactNode;
  /** Description rendered beneath the legend. */
  description?: ReactNode;
  /** Fields grouped by this fieldset. */
  children: ReactNode;
}

/** A semantic fieldset with an optional legend, description, and field stack. */
export const Fieldset = /*#__PURE__*/ forwardRef<HTMLFieldSetElement, FieldsetProps>(
  function Fieldset({ legend, description, className, children, ...rest }, ref) {
    return (
      <fieldset {...rest} ref={ref} className={cx('lyra-fieldset', className)}>
        {legend && <legend className="lyra-fieldset__legend">{legend}</legend>}
        {description && <p className="lyra-fieldset__desc">{description}</p>}
        <div className="lyra-fieldset__fields">{children}</div>
      </fieldset>
    );
  },
);

/** Props for {@link FormRow}. */
export interface FormRowProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of equal-width columns. Defaults to the number of children. */
  columns?: number;
  /** Fields arranged in the row. */
  children: ReactNode;
}

/** A responsive row of equally sized form fields that collapses to one column on small screens. */
export const FormRow = /*#__PURE__*/ forwardRef<HTMLDivElement, FormRowProps>(function FormRow(
  { columns, className, style, children, ...rest },
  ref,
) {
  const columnCount = columns || Children.count(children);
  const variableStyle: FormRowStyle = {
    '--lyra-formrow-columns': `repeat(${columnCount}, minmax(0, 1fr))`,
  };

  return (
    <div
      {...rest}
      ref={ref}
      className={cx('lyra-formrow', className)}
      style={{ ...variableStyle, ...style }}
    >
      {children}
    </div>
  );
});
