import { Fragment, forwardRef, useId } from 'react';
import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** A selectable tab in {@link Tabs}. */
export interface TabItem {
  /** Stable value reported by `onChange` when this tab becomes active. */
  id: string;
  /** Visible tab label. */
  label: ReactNode;
  /** Optional count displayed beside the label. */
  count?: number;
  /** Optional decorative or meaningful icon rendered before the label. */
  icon?: ReactNode;
}

/** Props for {@link Tabs}. */
export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Tabs rendered by the control, in keyboard-navigation order. */
  items: TabItem[];
  /** Id of the active tab. Tabs are controlled; update this value in `onChange`. */
  active: string;
  /** Called with a tab id after a click or keyboard navigation activates it. */
  onChange?: (id: string) => void;
  /** Visual treatment: underline tabs (`"line"`) or segmented tabs (`"pills"`). */
  variant?: 'line' | 'pills';
}

/**
 * Controlled tabs with roving focus and automatic activation.
 *
 * Each tab owns an empty labelled panel because the handoff contract supplies tab labels only,
 * not panel content. Consumers can associate related content with the generated panel ids.
 */
export const Tabs = /*#__PURE__*/ forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { items, active, onChange, variant = 'line', id, className, ...rest },
  ref,
) {
  const generatedId = useId();
  const tabsId = id ?? generatedId;
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === active),
  );

  const tabId = (index: number): string => `${tabsId}-tab-${index}`;
  const panelId = (index: number): string => `${tabsId}-panel-${index}`;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number): void => {
    if (event.defaultPrevented || items.length === 0) return;

    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = items.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    document.getElementById(tabId(nextIndex))?.focus();
    onChange?.(items[nextIndex].id);
  };

  return (
    <Fragment>
      <div
        {...rest}
        ref={ref}
        id={tabsId}
        className={cx('lyra-tabs', variant === 'pills' && 'lyra-tabs--pills', className)}
        role="tablist"
      >
        {items.map((item, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={item.id}
              id={tabId(index)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId(index)}
              tabIndex={selected ? 0 : -1}
              className={cx('lyra-tab', selected && 'lyra-tab--active')}
              onClick={() => onChange?.(item.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {item.icon}
              {item.label}
              {item.count != null && <span className="lyra-tab__count">{item.count}</span>}
            </button>
          );
        })}
      </div>
      {items.map((item, index) => (
        <div
          key={`${item.id}-panel`}
          id={panelId(index)}
          role="tabpanel"
          aria-labelledby={tabId(index)}
          tabIndex={0}
          hidden={index !== activeIndex}
        />
      ))}
    </Fragment>
  );
});
