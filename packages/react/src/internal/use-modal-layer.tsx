import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Context,
  type MutableRefObject,
  type ReactNode,
  type RefObject,
} from 'react';
import { getInitialFocusTarget, isEligibleInitialFocusTarget } from './use-initial-focus';

export interface ModalLayerValue {
  token: symbol;
  ancestry: symbol[];
  effectiveOpen: boolean;
  panelRef: RefObject<HTMLElement | null>;
  parentPanelRef?: RefObject<HTMLElement | null>;
  closeAuthorityRef: MutableRefObject<boolean>;
  activationOrderRef: MutableRefObject<number>;
}

interface LayerEntry extends Pick<
  ModalLayerValue,
  'token' | 'ancestry' | 'panelRef' | 'activationOrderRef'
> {
  overlay: HTMLElement;
  opener: Element | null;
  cycle: number;
  onTopmostChange: (topmost: boolean) => void;
}

interface AttributeClaim {
  value: string | null;
  count: number;
}

interface StyleClaim {
  value: string;
  priority: string;
}

interface DocumentState {
  entries: Set<LayerEntry>;
  attributeClaims: Map<HTMLElement, AttributeClaim>;
  claimNodes: Map<symbol, Set<HTMLElement>>;
  zIndexClaims: Map<HTMLElement, StyleClaim>;
  observer: MutationObserver | null;
  order: number;
  scrollLockCount: number;
  savedOverflow: string;
  savedPaddingRight: string;
}

interface ModalLayerShared {
  Context: Context<ModalLayerValue | null>;
  documents: WeakMap<Document, DocumentState>;
}

const modalLayerKey = Symbol.for('@lyra-ds/react/modal-layer/v1');
const backgroundClaimKey = Symbol.for('@lyra-ds/react/modal-layer/background/v1');
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function getShared(): ModalLayerShared {
  const root = globalThis as typeof globalThis & Record<symbol, ModalLayerShared | undefined>;
  if (!root[modalLayerKey]) {
    root[modalLayerKey] = {
      Context: createContext<ModalLayerValue | null>(null),
      documents: new WeakMap<Document, DocumentState>(),
    };
  }
  return root[modalLayerKey];
}

function getDocumentState(ownerDocument: Document): DocumentState {
  const shared = getShared();
  let state = shared.documents.get(ownerDocument);
  if (!state) {
    state = {
      entries: new Set(),
      attributeClaims: new Map(),
      claimNodes: new Map(),
      zIndexClaims: new Map(),
      observer: null,
      order: 0,
      scrollLockCount: 0,
      savedOverflow: '',
      savedPaddingRight: '',
    };
    shared.documents.set(ownerDocument, state);
  }
  return state;
}

function addAttributeClaim(state: DocumentState, node: HTMLElement): void {
  const current = state.attributeClaims.get(node);
  if (current) {
    current.count += 1;
    return;
  }
  const value = node.getAttribute('inert');
  state.attributeClaims.set(node, { value, count: 1 });
  if (value === null) node.setAttribute('inert', '');
}

function removeAttributeClaim(state: DocumentState, node: HTMLElement): void {
  const current = state.attributeClaims.get(node);
  if (!current) return;
  current.count -= 1;
  if (current.count > 0) return;
  state.attributeClaims.delete(node);
  if (current.value === null && node.getAttribute('inert') === '') node.removeAttribute('inert');
}

function replaceClaim(
  state: DocumentState,
  claimKey: symbol,
  nextNodes: Iterable<HTMLElement>,
): void {
  const previousNodes = state.claimNodes.get(claimKey) ?? new Set<HTMLElement>();
  const next = new Set(nextNodes);
  for (const node of previousNodes) {
    if (!next.has(node)) removeAttributeClaim(state, node);
  }
  for (const node of next) {
    if (!previousNodes.has(node)) addAttributeClaim(state, node);
  }
  if (next.size === 0) state.claimNodes.delete(claimKey);
  else state.claimNodes.set(claimKey, next);
}

function isAncestor(entry: LayerEntry, possibleAncestor: LayerEntry): boolean {
  return entry.ancestry.includes(possibleAncestor.token);
}

function getBranchOrder(state: DocumentState, token: symbol): number {
  let order = 0;
  for (const entry of state.entries) {
    if (entry.token === token || entry.ancestry.includes(token)) {
      order = Math.max(order, entry.cycle);
    }
  }
  return order;
}

function compareEntries(state: DocumentState, first: LayerEntry, second: LayerEntry): number {
  const firstPath = [...first.ancestry, first.token];
  const secondPath = [...second.ancestry, second.token];
  for (let index = 0; index < Math.min(firstPath.length, secondPath.length); index += 1) {
    if (firstPath[index] !== secondPath[index]) {
      return getBranchOrder(state, firstPath[index]) - getBranchOrder(state, secondPath[index]);
    }
  }
  return firstPath.length - secondPath.length;
}

function getTopmostEntry(state: DocumentState): LayerEntry | null {
  let topmost: LayerEntry | null = null;
  for (const entry of state.entries) {
    if (!topmost || compareEntries(state, entry, topmost) >= 0) topmost = entry;
  }
  return topmost;
}

function getBackgroundNodes(overlay: HTMLElement): Set<HTMLElement> {
  const nodes = new Set<HTMLElement>();
  const HTMLElementConstructor = overlay.ownerDocument.defaultView?.HTMLElement;
  if (!HTMLElementConstructor) return nodes;
  let current: HTMLElement | null = overlay;
  while (current?.parentElement) {
    const parent: HTMLElement = current.parentElement;
    for (const sibling of parent.children) {
      if (sibling instanceof HTMLElementConstructor && sibling !== current) nodes.add(sibling);
    }
    if (parent === overlay.ownerDocument.body) break;
    current = parent;
  }
  return nodes;
}

function restoreZIndexes(state: DocumentState): void {
  for (const [overlay, previous] of state.zIndexClaims) {
    overlay.style.setProperty('z-index', previous.value, previous.priority);
  }
  state.zIndexClaims.clear();
}

function synchronizeZIndexes(state: DocumentState): void {
  restoreZIndexes(state);
  const entries = Array.from(state.entries).sort((first, second) =>
    compareEntries(state, first, second),
  );
  const overlays = new Set(entries.map((entry) => entry.overlay));
  for (const [claim, nodes] of state.claimNodes) {
    if (claim !== backgroundClaimKey) {
      for (const overlay of nodes) overlays.add(overlay);
    }
  }
  const bases = Array.from(overlays, (overlay) =>
    Number.parseFloat(overlay.ownerDocument.defaultView?.getComputedStyle(overlay).zIndex ?? ''),
  );
  const highestBase = Math.max(0, ...bases.filter(Number.isFinite));
  entries.forEach((entry, index) => {
    const overlay = entry.overlay;
    const priority = overlay.style.getPropertyPriority('z-index');
    state.zIndexClaims.set(overlay, {
      value: overlay.style.getPropertyValue('z-index'),
      priority,
    });
    overlay.style.setProperty('z-index', String(highestBase + index + 1), priority);
  });
}

function reconcile(state: DocumentState): void {
  const previousTopmost = getTopmostEntry(state);
  for (const entry of state.entries) {
    if (!entry.overlay.isConnected) {
      state.entries.delete(entry);
      entry.onTopmostChange(false);
    }
  }
  const topmost = getTopmostEntry(state);
  replaceClaim(state, backgroundClaimKey, topmost ? getBackgroundNodes(topmost.overlay) : []);
  synchronizeZIndexes(state);
  for (const entry of state.entries) entry.onTopmostChange(entry === topmost);
  if (previousTopmost && !state.entries.has(previousTopmost)) {
    restoreSurvivingModalFocus(state, previousTopmost);
  }
  if (state.entries.size === 0) {
    state.observer?.disconnect();
    state.observer = null;
  }
}

function restoreSurvivingModalFocus(state: DocumentState, released: LayerEntry): void {
  const surviving = getTopmostEntry(state);
  if (!surviving) return;

  const ownerDocument = surviving.overlay.ownerDocument;
  const HTMLElementConstructor = ownerDocument.defaultView?.HTMLElement;
  if (!HTMLElementConstructor) return;
  const panel = surviving.panelRef.current;
  if (!panel?.isConnected || panel.closest('[inert]')) return;
  const activeElement = ownerDocument.activeElement;
  if (
    activeElement instanceof HTMLElementConstructor &&
    isEligibleInitialFocusTarget(activeElement, panel)
  ) {
    return;
  }

  const opener = released.opener;
  const target =
    opener instanceof HTMLElementConstructor && isEligibleInitialFocusTarget(opener, panel)
      ? opener
      : getInitialFocusTarget(panel);
  target.focus({ preventScroll: true });
}

function observe(ownerDocument: Document, state: DocumentState): void {
  if (state.entries.size === 0) {
    state.observer?.disconnect();
    state.observer = null;
    return;
  }
  if (state.observer) return;
  state.observer = new MutationObserver(() => reconcile(state));
  state.observer.observe(ownerDocument.body, { childList: true, subtree: true });
}

/**
 * A private React-tree ownership value shared by independently compiled package entries.
 * The provider deliberately carries no document state, keeping server renders and separate
 * React roots isolated while the browser registry is keyed by the owning document.
 */
export function useModalLayer(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
): ModalLayerValue {
  const parent = useContext(getShared().Context);
  const [token] = useState(() => Symbol('lyra-modal-layer'));
  const closeAuthorityRef = useRef(false);
  const activationOrderRef = useRef(0);

  const effectiveOpen = open && (parent?.effectiveOpen ?? true);
  useIsomorphicLayoutEffect(() => {
    if (!effectiveOpen) activationOrderRef.current = 0;
  }, [effectiveOpen]);

  return useMemo(
    () => ({
      token,
      ancestry: parent ? [...parent.ancestry, parent.token] : [],
      effectiveOpen,
      panelRef,
      parentPanelRef: parent?.panelRef,
      closeAuthorityRef,
      activationOrderRef,
    }),
    [effectiveOpen, panelRef, parent, token],
  );
}

export function ModalLayerProvider({
  layer,
  children,
}: {
  layer: ModalLayerValue;
  children: ReactNode;
}): ReactNode {
  const Context = getShared().Context;
  return <Context.Provider value={layer}>{children}</Context.Provider>;
}

export interface ModalLayerRegistration {
  topmost: boolean;
  closeAuthorityRef: RefObject<boolean>;
  isTopmost: () => boolean;
}

/** Reads the accepted document registry at event time, rather than a render-time subscription. */
export function isModalLayerTopmost(overlay: HTMLElement | null, token: symbol): boolean {
  if (!overlay?.isConnected) return false;
  return getTopmostEntry(getDocumentState(overlay.ownerDocument))?.token === token;
}

/** Registers a portaled modal only after its owned overlay exists in the DOM. */
export function useModalLayerRegistration(
  layer: ModalLayerValue,
  overlay: HTMLElement | null,
  captureOpener?: (element: Element | null) => void,
  revokeGesture?: () => void,
): ModalLayerRegistration {
  const [topmost, setTopmost] = useState(false);
  const stateRef = useRef<DocumentState | null>(null);
  const {
    ancestry,
    closeAuthorityRef,
    effectiveOpen,
    panelRef,
    parentPanelRef,
    token,
    activationOrderRef,
  } = layer;

  useIsomorphicLayoutEffect(() => {
    if (!effectiveOpen || !overlay) {
      setTopmost(false);
      return;
    }

    const ownerDocument = overlay.ownerDocument;
    const state = getDocumentState(ownerDocument);
    stateRef.current = state;
    closeAuthorityRef.current = false;

    // Capture before this entry can make an external opener inert. A nested branch only owns a
    // real opener from its live parent; an initially-open child instead returns to its panel.
    const parentToken = ancestry[ancestry.length - 1];
    const parentEntry = Array.from(state.entries).find((entry) => entry.token === parentToken);
    const activeElement = ownerDocument.activeElement;
    const parentPanel = parentEntry?.panelRef.current ?? parentPanelRef?.current;
    const focusOwner = Array.from(state.entries).find(
      (candidate) =>
        candidate.panelRef.current === activeElement?.closest('[role="dialog"][aria-modal="true"]'),
    );
    const focusedInParentBranch =
      parentPanel?.contains(activeElement) ||
      (focusOwner &&
        (focusOwner.token === parentToken || focusOwner.ancestry.includes(parentToken)));
    const opener = activeElement && focusedInParentBranch ? activeElement : parentPanel;
    const capturedOpener = ancestry.length === 0 ? activeElement : (opener ?? null);
    captureOpener?.(capturedOpener);
    if (activationOrderRef.current === 0) activationOrderRef.current = ++state.order;
    const cycle = activationOrderRef.current;
    for (const ancestor of state.entries) {
      if (ancestry.includes(ancestor.token) && ancestor.cycle < cycle) {
        ancestor.cycle = cycle;
        ancestor.activationOrderRef.current = cycle;
      }
    }
    const entry: LayerEntry = {
      token,
      ancestry,
      panelRef,
      activationOrderRef,
      overlay,
      opener: capturedOpener,
      cycle,
      onTopmostChange: (nextTopmost) => {
        if (!nextTopmost) revokeGesture?.();
        setTopmost(nextTopmost);
      },
    };
    state.entries.add(entry);
    observe(ownerDocument, state);
    reconcile(state);

    return () => {
      const topmostBeforeRelease = getTopmostEntry(state);
      closeAuthorityRef.current = Boolean(
        topmostBeforeRelease &&
        (topmostBeforeRelease === entry || isAncestor(topmostBeforeRelease, entry)),
      );
      state.entries.delete(entry);
      reconcile(state);
      // Owned aria-modal reflects this commit before layout cleanup runs. An accepted close
      // leaves a retained inactive panel; its one-shot return owner chooses the destination.
      const panel = panelRef.current;
      if (!panel || panel.getAttribute('aria-modal') === 'true') {
        restoreSurvivingModalFocus(state, entry);
      }
      observe(ownerDocument, state);
      setTopmost(false);
    };
  }, [
    ancestry,
    activationOrderRef,
    captureOpener,
    closeAuthorityRef,
    effectiveOpen,
    overlay,
    panelRef,
    parentPanelRef,
    revokeGesture,
    token,
  ]);

  return {
    topmost,
    closeAuthorityRef,
    isTopmost: () => {
      return Boolean(stateRef.current && isModalLayerTopmost(overlay, token));
    },
  };
}

/** Shares exact prior inert attributes between active background and retained-exit claims. */
export function claimInactiveModalOverlay(
  overlay: HTMLElement,
  claimKey: symbol,
  inactive: boolean,
): void {
  const state = getDocumentState(overlay.ownerDocument);
  replaceClaim(state, claimKey, inactive ? [overlay] : []);
}

/** Acquires the document-scoped scroll lock shared by all independently bundled entries. */
export function acquireModalScrollLock(ownerDocument: Document): () => void {
  const state = getDocumentState(ownerDocument);
  state.scrollLockCount += 1;
  if (state.scrollLockCount === 1) {
    const body = ownerDocument.body;
    const view = ownerDocument.defaultView;
    state.savedOverflow = body.style.overflow;
    state.savedPaddingRight = body.style.paddingRight;
    const scrollbarWidth = view ? view.innerWidth - ownerDocument.documentElement.clientWidth : 0;
    const existingPadding = view
      ? Number.parseFloat(view.getComputedStyle(body).paddingRight) || 0
      : 0;
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${existingPadding + scrollbarWidth}px`;
  }
  return () => {
    state.scrollLockCount -= 1;
    if (state.scrollLockCount !== 0) return;
    const body = ownerDocument.body;
    body.style.overflow = state.savedOverflow;
    body.style.paddingRight = state.savedPaddingRight;
  };
}
