'use client';

import { Card } from '@lyra-ds/react';
import { useTranslations } from 'next-intl';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

/**
 * One documented example: the live component on a Lyra Card, with its own source
 * behind a toggle. The source node is highlighted on the server from the example's
 * file, so what you read is exactly what renders above it.
 */
/**
 * How the stage arranges an example.
 *
 * - `row` (default): a wrapping flex row — right for chips and controls sitting side by side.
 * - `block`: full-width rows — right for container components that would otherwise shrink to their
 *   content and leave the stage half empty.
 * - `plain`: full-width rows without the Card chrome — for components that are themselves a
 *   surface, so the example is not a card inside a card.
 * - `isolated`: a separate document — for page-level components that emit landmarks or an h1.
 */
export type ExampleLayout = 'row' | 'block' | 'plain' | 'isolated';

const isolatedDocument = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0}</style></head><body></body></html>`;
const isolatedPreviewLayoutWidth = 1200;

/**
 * Renders page-level examples in their own document. The portal keeps the live preview and its
 * printed consumer source separate, while cloned stylesheets make the frame use the active DS theme.
 */
function IsolatedPreview({ preview, title }: { preview: ReactNode; title: string }) {
  const [mounted, setMounted] = useState(false);
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [frameLoadVersion, setFrameLoadVersion] = useState(0);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [contentHeight, setContentHeight] = useState(1);

  const setFrameRef = useCallback((element: HTMLIFrameElement | null) => {
    setFrame(element);
  }, []);

  const setStageRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;

    const syncWidth = () => setStageWidth(element.clientWidth);
    const resizeObserver = new ResizeObserver(syncWidth);

    syncWidth();
    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!frame) return;

    const iframeDocument = frame.contentDocument;
    if (!iframeDocument?.body) return;

    const hostDocument = document;
    const syncDocumentAttributes = () => {
      const theme = hostDocument.documentElement.getAttribute('data-theme');

      if (theme) {
        iframeDocument.documentElement.setAttribute('data-theme', theme);
      } else {
        iframeDocument.documentElement.removeAttribute('data-theme');
      }

      iframeDocument.documentElement.lang = hostDocument.documentElement.lang;
    };
    const syncHeight = () => {
      const height = Math.ceil(
        Math.max(iframeDocument.body.scrollHeight, iframeDocument.documentElement.scrollHeight),
      );

      setContentHeight(Math.max(height, 1));
    };
    const hostStyles = hostDocument.head.querySelectorAll('link[rel="stylesheet"], style');

    hostStyles.forEach((style) => {
      iframeDocument.head.append(style.cloneNode(true));
    });
    syncDocumentAttributes();
    setPortalTarget(iframeDocument.body);

    const themeObserver = new MutationObserver(syncDocumentAttributes);
    themeObserver.observe(hostDocument.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'lang'],
    });

    const resizeObserver = new ResizeObserver(syncHeight);
    resizeObserver.observe(iframeDocument.body);
    resizeObserver.observe(iframeDocument.documentElement);

    const stylesheetLinks =
      iframeDocument.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]');
    stylesheetLinks.forEach((link) => link.addEventListener('load', syncHeight));
    syncHeight();

    return () => {
      themeObserver.disconnect();
      resizeObserver.disconnect();
      stylesheetLinks.forEach((link) => link.removeEventListener('load', syncHeight));
      setPortalTarget(null);
    };
  }, [frame, frameLoadVersion]);

  // SSR intentionally leaves an empty stage: the page-level preview must not enter the host DOM.
  if (!mounted) return <div className="lw-example__isolated-placeholder" aria-busy="true" />;

  const scale = Math.min(stageWidth / isolatedPreviewLayoutWidth, 1);
  const scaledHeight = Math.max(contentHeight * scale, 1);

  return (
    <div ref={setStageRef} className="lw-example__frame-scaler" style={{ height: scaledHeight }}>
      <iframe
        ref={setFrameRef}
        className="lw-example__frame"
        onLoad={() => setFrameLoadVersion((version) => version + 1)}
        srcDoc={isolatedDocument}
        style={{
          width: isolatedPreviewLayoutWidth,
          height: contentHeight,
          transform: `scale(${scale})`,
        }}
        title={title}
      >
        {portalTarget ? createPortal(preview, portalTarget) : null}
      </iframe>
    </div>
  );
}

export function ExampleView({
  children,
  layout = 'row',
  preview,
  source,
  title,
}: {
  children?: ReactNode;
  layout?: ExampleLayout;
  preview: ReactNode;
  source: ReactNode;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();

  return (
    <section className="lw-example">
      {title ? <h3 className="lw-example__title">{title}</h3> : null}
      {children}
      {layout === 'isolated' ? (
        <div className="lw-example__stage--isolated">
          <IsolatedPreview preview={preview} title={t('isolatedPreview')} />
        </div>
      ) : layout === 'plain' ? (
        <div className="lw-example__stage--plain">{preview}</div>
      ) : (
        <Card
          className={
            layout === 'block' ? 'lw-example__stage lw-example__stage--block' : 'lw-example__stage'
          }
        >
          {preview}
        </Card>
      )}
      <button
        type="button"
        className="lw-example__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {open ? t('hideCode') : t('showCode')}
      </button>
      {open ? <div className="lw-example__code">{source}</div> : null}
    </section>
  );
}
