import { Children, cloneElement, forwardRef, isValidElement } from 'react';
import type { CSSProperties, ReactElement, Ref, RefCallback } from 'react';

type SlotElementProps = Record<string, unknown>;

/** Props merged onto the single child element rendered by {@link Slot}. */
export interface SlotProps extends Record<string, unknown> {
  /** The one element that receives the Slot props. */
  children: ReactElement;
  /** Classes appended before classes already present on the child. */
  className?: string;
  /** Inline styles merged before styles already present on the child. */
  style?: CSSProperties;
}

function isEventHandler(name: string, value: unknown): value is (...args: unknown[]) => unknown {
  return /^on[A-Z]/.test(name) && typeof value === 'function';
}

function composeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as { current: T | null }).current = node;
    }
  };
}

/**
 * Merge props into one child element without adding a wrapper node.
 *
 * Child classes and styles are appended after Slot values so a consumer can extend the
 * component's presentation. Event handlers are composed child-first, then Slot, so both run.
 */
export const Slot = /*#__PURE__*/ forwardRef<HTMLElement, SlotProps>(function Slot(
  { children, className, style, ...slotProps },
  forwardedRef,
) {
  const child = Children.only(children);
  if (!isValidElement(child)) {
    throw new Error('Slot expects exactly one React element child.');
  }

  const childProps = child.props as SlotElementProps;
  const mergedProps: SlotElementProps = { ...slotProps };

  for (const [name, childValue] of Object.entries(childProps)) {
    const slotValue = slotProps[name];
    if (isEventHandler(name, childValue) && isEventHandler(name, slotValue)) {
      mergedProps[name] = (...args: unknown[]) => {
        childValue(...args);
        slotValue(...args);
      };
    } else if (name !== 'className' && name !== 'style') {
      mergedProps[name] = childValue;
    }
  }

  if (className || childProps.className) {
    mergedProps.className = [className, childProps.className].filter(Boolean).join(' ');
  }
  if (style || childProps.style) {
    mergedProps.style = { ...(style ?? {}), ...((childProps.style as CSSProperties) ?? {}) };
  }

  const childRef = childProps.ref as Ref<HTMLElement> | undefined;
  mergedProps.ref = composeRefs(childRef, forwardedRef);

  return cloneElement(child, mergedProps);
});
