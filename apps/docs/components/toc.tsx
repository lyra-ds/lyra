'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import {
  TableOfContents as LyraTableOfContents,
  type TableOfContentsItem,
  useScrollSpy,
} from '@lyra-ds/react';
import { useEffect, useState } from 'react';

type Heading = TableOfContentsItem;

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * "On this page" contents. Reads the rendered MDX headings from the prose scope
 * (assigning ids where the pipeline didn't) and scroll-spies the active one.
 * Renders an empty placeholder on sparse pages to keep the Shell grid stable.
 */
export function TableOfContents() {
  const t = useTranslations();
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>([]);
  const activeId = useScrollSpy(headings.map((heading) => heading.id));

  useEffect(() => {
    const container = document.querySelector('.lyra-prose');
    if (!container) return;

    const els = Array.from(container.querySelectorAll('h2, h3')) as HTMLElement[];
    const parsed: Heading[] = els.map((el) => {
      if (!el.id) el.id = slugify(el.textContent ?? '');
      return { id: el.id, text: el.textContent ?? '', level: el.tagName === 'H2' ? 2 : 3 };
    });
    setHeadings(parsed);
    return undefined;
  }, [pathname]);

  if (headings.length < 2) return <div aria-hidden="true" />;

  return <LyraTableOfContents items={headings} activeId={activeId} label={t('onThisPage')} />;
}
