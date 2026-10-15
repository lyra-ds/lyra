import { useEffect, useLayoutEffect } from 'react';
import type { RefObject } from 'react';

interface Owner {
  trigger: HTMLButtonElement;
  controls: string;
  collapsed: boolean;
  change: (collapsed: boolean) => void;
}

interface DocumentOwners {
  owners: Set<Owner>;
  listener: (event: KeyboardEvent) => void;
}

const ownersKey = Symbol.for('@lyra-ds/react/app-sidebar-hotkey/v1');
const useCommitEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function documents(): WeakMap<Document, DocumentOwners> {
  const root = globalThis as typeof globalThis &
    Record<symbol, WeakMap<Document, DocumentOwners> | undefined>;
  return (root[ownersKey] ??= new WeakMap());
}

function visible(element: HTMLElement): boolean {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  return (
    element.isConnected &&
    !element.closest('[hidden], [inert], [aria-hidden="true"]') &&
    style?.visibility !== 'hidden' &&
    style?.visibility !== 'collapse' &&
    element.getClientRects().length > 0
  );
}

function eligible(owner: Owner): boolean {
  if (owner.trigger.matches(':disabled')) return false;
  if (visible(owner.trigger)) return true;
  const panel = owner.trigger.ownerDocument.getElementById(owner.controls);
  // Drawer owns modal arbitration. Only its live, non-inert panel can stand in for an inert opener.
  return Boolean(
    !owner.collapsed &&
    owner.trigger.closest('[inert]') &&
    panel &&
    panel.matches('[role="dialog"][aria-modal="true"]') &&
    visible(panel),
  );
}

export function requestSidebarChange(owner: Owner): void {
  const { trigger, controls, collapsed, change } = owner;
  const panel = trigger.ownerDocument.getElementById(controls);
  if (
    !collapsed &&
    panel?.contains(trigger.ownerDocument.activeElement) &&
    !panel.matches('[role="dialog"]') &&
    visible(trigger) &&
    !trigger.matches(':disabled')
  ) {
    trigger.focus({ preventScroll: true });
  }
  change(!collapsed);
}

function act(event: KeyboardEvent, owners: Set<Owner>): void {
  if (
    event.defaultPrevented ||
    event.repeat ||
    event.isComposing ||
    event.keyCode === 229 ||
    event.altKey ||
    event.shiftKey ||
    !(event.ctrlKey || event.metaKey) ||
    event.key.toLowerCase() !== 'b'
  )
    return;
  const target = event.composedPath()[0];
  const doc = event.currentTarget as Document;
  const ElementClass = doc.defaultView?.Element;
  if (
    !ElementClass ||
    !(target instanceof ElementClass) ||
    target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [inert]',
    )
  )
    return;

  const logical = new Map<string, { owner: Owner; distance: number }>();
  for (const owner of owners) {
    if (!eligible(owner)) continue;
    const panel = doc.getElementById(owner.controls);
    let distance = 0;
    let current: Element | null = target;
    while (current && current !== owner.trigger && current !== panel) {
      distance++;
      current = current.parentElement;
    }
    if (!current) distance = Infinity;
    const previous = logical.get(owner.controls);
    if (!previous || distance < previous.distance) logical.set(owner.controls, { owner, distance });
  }
  const candidates = [...logical.values()].sort((a, b) => a.distance - b.distance);
  const first = candidates[0];
  if (!first || (candidates.length > 1 && first.distance === candidates[1].distance)) return;
  event.preventDefault();
  requestSidebarChange(first.owner);
}

/** Register committed props per owning document, shared across independently built entries. */
export function useAppSidebarHotkey(
  ref: RefObject<HTMLButtonElement | null>,
  controls: string,
  collapsed: boolean,
  change: (collapsed: boolean) => void,
  enabled: boolean,
): void {
  useCommitEffect(() => {
    const trigger = ref.current;
    if (!enabled || !trigger) return;
    const doc = trigger.ownerDocument;
    const registry = documents();
    let state = registry.get(doc);
    if (!state) {
      const owners = new Set<Owner>();
      state = { owners, listener: (event) => act(event, owners) };
      registry.set(doc, state);
      doc.addEventListener('keydown', state.listener);
    }
    const owner = { trigger, controls, collapsed, change };
    state.owners.add(owner);
    return () => {
      state.owners.delete(owner);
      if (state.owners.size === 0) {
        doc.removeEventListener('keydown', state.listener);
        registry.delete(doc);
      }
    };
  });
}
