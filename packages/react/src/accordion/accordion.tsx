import { forwardRef, useId, useState } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../internal/cx';

/** An expandable item in {@link Accordion}. */
export interface AccordionItem {
  /** Stable item identifier used by `defaultOpen`. */
  id: string;
  /** Heading shown on the item's trigger button. */
  title: ReactNode;
  /** Content revealed when the item is open. */
  content: ReactNode;
}

/** Props for {@link Accordion}. */
export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  /** Items rendered in their supplied order. */
  items: AccordionItem[];
  /** Id of the item initially open. */
  defaultOpen?: string;
  /** Whether more than one item may be open at once. Defaults to `false`. */
  multiple?: boolean;
}

/** An uncontrolled disclosure list whose headers remain in the normal Tab order. */
export const Accordion = /*#__PURE__*/ forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion({ items, defaultOpen, multiple = false, id, className, ...rest }, ref) {
    const [openItems, setOpenItems] = useState<Set<string>>(
      () => new Set(defaultOpen === undefined ? [] : [defaultOpen]),
    );
    const generatedId = useId();
    const accordionId = id ?? generatedId;

    const toggle = (itemId: string): void => {
      setOpenItems((previous) => {
        const next = new Set(multiple ? previous : []);
        if (previous.has(itemId)) next.delete(itemId);
        else next.add(itemId);
        return next;
      });
    };

    return (
      <div {...rest} ref={ref} id={accordionId} className={cx('lyra-accordion', className)}>
        {items.map((item, index) => {
          const open = openItems.has(item.id);
          const triggerId = `${accordionId}-trigger-${index}`;
          const panelId = `${accordionId}-panel-${index}`;
          return (
            <div key={item.id} className={cx('lyra-acc__item', open && 'lyra-acc__item--open')}>
              <button
                id={triggerId}
                type="button"
                className="lyra-acc__trigger"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                {item.title}
                <span className="lyra-acc__chevron" aria-hidden="true" />
              </button>
              {/*
                The panel stays mounted so its height can animate: a conditionally rendered node has
                no "from" size to transition from. Collapsed, the wrapper is a 0fr grid row and is
                `inert` + `visibility: hidden`, so the content is out of the tab order and out of the
                accessibility tree — a collapsed panel must not be reachable just because it exists.
                On React 18, which does not map `inert`, the CSS `visibility: hidden` above is what
                keeps the collapsed panel out of the tab order and the accessibility tree.
              */}
              <div className="lyra-acc__panel-wrap" inert={!open}>
                {/*
                  The clip element carries no padding of its own on purpose. A 0fr row still
                  reserves the grid item's padding — padding does not shrink — so the padded panel
                  needs an unpadded element between it and the animated row.
                */}
                <div className="lyra-acc__panel-clip">
                  <div id={panelId} className="lyra-acc__panel" aria-labelledby={triggerId}>
                    {item.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
