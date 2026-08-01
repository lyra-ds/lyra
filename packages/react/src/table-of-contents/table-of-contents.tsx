import { forwardRef, useEffect, useRef, useState } from 'react';
import type { HTMLAttributes } from 'react';
import { cx } from '../internal/cx';

/** A link in a {@link TableOfContents}. */
export interface TableOfContentsItem {
  /** The id of the in-page target heading. */
  id: string;
  /** Visible link text. */
  text: string;
  /** Heading level used to express the item's hierarchy. */
  level: number;
}

/** Props for {@link TableOfContents}. */
export interface TableOfContentsProps extends HTMLAttributes<HTMLElement> {
  /** In-page anchor links rendered in the contents rail. */
  items: TableOfContentsItem[];
  /** Id of the current in-page position. The component does not derive it from scroll state. */
  activeId?: string;
  /** Visible heading and accessible name for the contents navigation landmark. */
  label: string;
}

/**
 * Tracks the topmost element in the observer's biased band. When that band is empty, the hook
 * keeps the nearest preceding item active (or the first/last item at document boundaries).
 * Missing document elements are ignored, and the observer is created only after mount.
 */
export function useScrollSpy(ids: string[]): string | undefined {
  const idsKey = ids.join('\u0000');
  const [active, setActive] = useState<{ id: string | undefined; idsKey: string }>({
    id: undefined,
    idsKey,
  });
  const intersectingElements = useRef(new Map<string, Element>());

  useEffect(() => {
    const visibleElements = intersectingElements.current;
    visibleElements.clear();

    const elements = (idsKey ? idsKey.split('\u0000') : [])
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element != null);

    if (elements.length === 0) return undefined;

    const resolveActive = (): string => {
      const topmost = Array.from(visibleElements.values()).sort(
        (left, right) => left.getBoundingClientRect().top - right.getBoundingClientRect().top,
      )[0];
      if (topmost) return topmost.id;

      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      );
      const isAtDocumentEnd =
        window.scrollY > 0 && window.scrollY + window.innerHeight >= documentHeight - 1;
      if (isAtDocumentEnd) return elements.at(-1)!.id;

      const observationBandEnd = window.innerHeight * 0.3;
      const nearestPrevious = elements
        .filter((element) => element.getBoundingClientRect().top <= observationBandEnd)
        .at(-1);

      return nearestPrevious?.id ?? elements[0].id;
    };

    // The observer's biased band is intentionally empty before the first heading and after the
    // last. Seed the first item, then use the nearest preceding heading as that fallback.
    let disposed = false;
    queueMicrotask(() => {
      if (!disposed) setActive({ id: elements[0].id, idsKey });
    });

    if (typeof IntersectionObserver === 'undefined') {
      return () => {
        disposed = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleElements.set(entry.target.id, entry.target);
          else visibleElements.delete(entry.target.id);
        });

        setActive({ id: resolveActive(), idsKey });
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    );

    elements.forEach((element) => observer.observe(element));
    const updateBoundaryFallback = () => {
      if (visibleElements.size === 0) setActive({ id: resolveActive(), idsKey });
    };
    window.addEventListener('scroll', updateBoundaryFallback, { passive: true });
    window.addEventListener('resize', updateBoundaryFallback);

    return () => {
      disposed = true;
      observer.disconnect();
      visibleElements.clear();
      window.removeEventListener('scroll', updateBoundaryFallback);
      window.removeEventListener('resize', updateBoundaryFallback);
    };
  }, [idsKey]);

  return active.idsKey === idsKey ? active.id : undefined;
}

/** A labelled, controlled in-page contents navigation rail. */
export const TableOfContents = /*#__PURE__*/ forwardRef<HTMLElement, TableOfContentsProps>(
  function TableOfContents({ items, activeId, label, className, ...rest }, ref) {
    return (
      <nav {...rest} ref={ref} className={cx('lyra-toc', className)} aria-label={label}>
        <span className="lyra-toc__title">{label}</span>
        <ul className="lyra-toc__list">
          {items.map((item) => {
            const active = item.id === activeId;

            return (
              <li key={item.id} data-level={item.level}>
                <a
                  href={`#${item.id}`}
                  className={cx('lyra-toc__link', active && 'lyra-toc__link--active')}
                  aria-current={active ? 'location' : undefined}
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  },
);
