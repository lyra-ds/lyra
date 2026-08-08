/**
 * Observe in-page targets and report the topmost target in the scrolling observation band.
 * Returns a cleanup function so callers can stop observing when their Alpine scope is destroyed.
 */
export function observeScrollSpy(
  ids: string[],
  onChange: (id: string | undefined) => void,
): () => void {
  if (typeof document === 'undefined') return () => undefined;

  const elements = ids
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => element != null);

  if (elements.length === 0) return () => undefined;

  const intersectingElements = new Map<string, Element>();
  const resolveActive = (): string => {
    const topmost = Array.from(intersectingElements.values()).sort(
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

  let disposed = false;
  queueMicrotask(() => {
    if (!disposed) onChange(elements[0].id);
  });

  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
    return () => {
      disposed = true;
      intersectingElements.clear();
    };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) intersectingElements.set(entry.target.id, entry.target);
        else intersectingElements.delete(entry.target.id);
      });

      onChange(resolveActive());
    },
    { rootMargin: '0px 0px -70% 0px', threshold: 0 },
  );

  elements.forEach((element) => observer.observe(element));
  const updateBoundaryFallback = (): void => {
    if (intersectingElements.size === 0) onChange(resolveActive());
  };
  window.addEventListener('scroll', updateBoundaryFallback, { passive: true });
  window.addEventListener('resize', updateBoundaryFallback);

  return () => {
    disposed = true;
    observer.disconnect();
    intersectingElements.clear();
    window.removeEventListener('scroll', updateBoundaryFallback);
    window.removeEventListener('resize', updateBoundaryFallback);
  };
}
