'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Heading = { id: string; text: string; level: 2 | 3 };

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * "On this page" rail. Reads the rendered MDX headings from the content column
 * (assigning ids where the pipeline didn't) and scroll-spies the active one.
 * Renders an empty column placeholder on sparse pages to keep the grid stable.
 */
export function TableOfContents() {
  const t = useTranslations();
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState('');

  useEffect(() => {
    const container = document.querySelector('.lw-docs__content');
    if (!container) return;

    const els = Array.from(container.querySelectorAll('h2, h3')) as HTMLElement[];
    const parsed: Heading[] = els.map((el) => {
      if (!el.id) el.id = slugify(el.textContent ?? '');
      return { id: el.id, text: el.textContent ?? '', level: el.tagName === 'H2' ? 2 : 3 };
    });
    setHeadings(parsed);
    setActive(parsed[0]?.id ?? '');

    const observer = new IntersectionObserver(
      (entries) => {
        const onscreen = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (onscreen[0]) setActive(onscreen[0].target.id);
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  if (headings.length < 2) return <div className="lw-toc" aria-hidden="true" />;

  return (
    <nav className="lw-toc" aria-label={t('onThisPage')}>
      <span className="lw-toc__title">{t('onThisPage')}</span>
      <ul className="lw-toc__list">
        {headings.map((h) => (
          <li key={h.id} data-level={h.level}>
            <a
              href={`#${h.id}`}
              className={['lw-toc__link', active === h.id && 'lw-toc__link--active']
                .filter(Boolean)
                .join(' ')}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
