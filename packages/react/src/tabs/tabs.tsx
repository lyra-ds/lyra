import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type {
  ButtonHTMLAttributes,
  ForwardedRef,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  MutableRefObject,
  ReactNode,
} from 'react';
import { cx } from '../internal/cx';

/** A selectable tab in a consumer-owned Tabs composition. */
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
export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onChange' | 'children' | 'role'
> {
  /** Id of the active tab. Tabs are controlled; update this value in `onChange`. */
  active: string;
  /** Called with a tab id after a click or keyboard navigation requests activation. */
  onChange?: (value: string) => void;
  /** Visual treatment: underline tabs (`"line"`) or segmented tabs (`"pills"`). */
  variant?: 'line' | 'pills';
  /** Named list, trigger, and content parts owned by this Tabs root. */
  children: ReactNode;
}

/** Props for the tablist part. */
export interface TabsListProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'role' | 'children' | 'tabIndex'
> {
  /** Tab triggers rendered in their native keyboard-navigation order. */
  children: ReactNode;
}

/** Props for a consumer-owned tab trigger. */
export interface TabsTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'children' | 'id' | 'role' | 'type' | 'tabIndex' | 'aria-selected' | 'aria-controls'
> {
  /** Stable value shared with this trigger's matching content panel. */
  value: string;
  /** Visible trigger label. */
  children: ReactNode;
  /** Optional supplementary count displayed after the label. */
  count?: number;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
}

/** Props for a consumer-owned tab panel. */
export interface TabsContentProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'id' | 'role' | 'tabIndex' | 'aria-labelledby' | 'hidden'
> {
  /** Stable value shared with this panel's matching trigger. */
  value: string;
  /** Consumer-owned content that remains mounted across tab switches. */
  children: ReactNode;
}

interface TabsContextValue {
  active: string;
  entryValue: string | null;
  rootId: string;
  rootRef: MutableRefObject<HTMLDivElement | null>;
  normalizeEntry: (list: HTMLDivElement) => void;
  onChange?: (value: string) => void;
  variant: 'line' | 'pills';
}

const TabsContext = createContext<TabsContextValue | null>(null);
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function useTabsContext(part: string): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) throw new Error(`[lyra] ${part} must be rendered inside Tabs.`);
  return context;
}

function partId(rootId: string, kind: 'tab' | 'panel', value: string): string {
  return `${rootId}-${kind}-${encodeURIComponent(value)}`;
}

function isOwnedByRoot(node: Element, root: HTMLDivElement): boolean {
  return node.closest('[data-lyra-tabs]') === root;
}

function isEligibleTrigger(trigger: HTMLButtonElement, root: HTMLDivElement): boolean {
  if (trigger.matches(':disabled') || !isOwnedByRoot(trigger, root)) return false;

  for (let node: Element | null = trigger; node; node = node.parentElement) {
    if (node.hasAttribute('hidden') || node.hasAttribute('inert')) return false;
    const style = getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse'
    ) {
      return false;
    }
    if (node === root) break;
  }

  return true;
}

function ownedTriggers(list: HTMLDivElement, root: HTMLDivElement): HTMLButtonElement[] {
  return Array.from(list.querySelectorAll<HTMLButtonElement>('button[role="tab"]')).filter(
    (trigger) => trigger.closest('[role="tablist"]') === list && isEligibleTrigger(trigger, root),
  );
}

function eventTrigger(
  target: EventTarget | null,
  list: HTMLDivElement,
  root: HTMLDivElement,
): HTMLButtonElement | null {
  if (!(target instanceof Element)) return null;
  const trigger = target.closest<HTMLButtonElement>('button[role="tab"]');
  if (!trigger || trigger.closest('[role="tablist"]') !== list || !isOwnedByRoot(trigger, root)) {
    return null;
  }
  return trigger;
}

function revealTriggerInset(list: HTMLDivElement, trigger: HTMLButtonElement): void {
  const listRect = list.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const inset = 4;
  const offset =
    triggerRect.left < listRect.left + inset
      ? triggerRect.left - (listRect.left + inset)
      : triggerRect.right > listRect.right - inset
        ? triggerRect.right - (listRect.right - inset)
        : 0;
  if (offset) list.scrollBy({ left: offset > 0 ? Math.ceil(offset) : Math.floor(offset) });
}

function setForwardedRef<T>(ref: ForwardedRef<T>, node: T | null): void {
  if (typeof ref === 'function') ref(node);
  else if (ref) ref.current = node;
}

/** A controlled, compound Tabs owner. */
export const Tabs = /*#__PURE__*/ forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { active, onChange, variant = 'line', id, children, ...rest },
  ref,
) {
  const generatedId = useId();
  const rootId = id ?? generatedId;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const focusedOwnedNodeRef = useRef<HTMLElement | null>(null);
  const [entryValue, setEntryValue] = useState<string | null>(null);

  const normalizeEntry = useCallback(
    (list: HTMLDivElement): void => {
      const root = rootRef.current;
      if (!root || !isOwnedByRoot(list, root)) return;
      const triggers = ownedTriggers(list, root);
      const selected = triggers.find((trigger) => trigger.dataset.value === active);
      const nextEntry = selected?.dataset.value ?? triggers[0]?.dataset.value ?? null;
      setEntryValue((current) => (current === nextEntry ? current : nextEntry));

      if (selected === root.ownerDocument.activeElement) revealTriggerInset(list, selected);

      const focusedOwnedNode = focusedOwnedNodeRef.current;
      if (!focusedOwnedNode || focusedOwnedNode.isConnected) return;
      const activeElement = root.ownerDocument.activeElement;
      if (
        activeElement !== root.ownerDocument.body &&
        activeElement !== root.ownerDocument.documentElement
      ) {
        return;
      }

      focusedOwnedNodeRef.current = null;
      (selected ?? triggers[0] ?? list).focus();
    },
    [active],
  );

  const setRootNode = useCallback(
    (node: HTMLDivElement | null): void => {
      rootRef.current = node;
      setForwardedRef(ref, node);
    },
    [ref],
  );

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const list = Array.from(root.querySelectorAll<HTMLDivElement>('[role="tablist"]')).find(
      (candidate) => isOwnedByRoot(candidate, root),
    );
    if (list) normalizeEntry(list);
  });

  const context: TabsContextValue = {
    active,
    entryValue,
    rootId,
    rootRef,
    normalizeEntry,
    onChange,
    variant,
  };

  return (
    <TabsContext.Provider value={context}>
      <div
        {...rest}
        ref={setRootNode}
        id={rootId}
        data-lyra-tabs=""
        onFocusCapture={(event) => {
          const focused = event.target as HTMLElement;
          if (isOwnedByRoot(focused, event.currentTarget)) focusedOwnedNodeRef.current = focused;
          rest.onFocusCapture?.(event);
        }}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
});

/** The native tablist that owns default tab interactions. */
export const TabsList = /*#__PURE__*/ forwardRef<HTMLDivElement, TabsListProps>(function TabsList(
  { className, onClick, onKeyDown, children, ...rest },
  ref,
) {
  const context = useTabsContext('TabsList');
  const listRef = useRef<HTMLDivElement | null>(null);

  const setListNode = useCallback(
    (node: HTMLDivElement | null): void => {
      listRef.current = node;
      setForwardedRef(ref, node);
    },
    [ref],
  );

  useIsomorphicLayoutEffect(() => {
    const list = listRef.current;
    if (list) context.normalizeEntry(list);
  });

  const requestClick = (event: MouseEvent<HTMLDivElement>): void => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    const root = context.rootRef.current;
    if (!root) return;
    const trigger = eventTrigger(event.target, event.currentTarget, root);
    if (!trigger || !isEligibleTrigger(trigger, root)) return;
    context.onChange?.(trigger.dataset.value!);
  };

  const requestKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const root = context.rootRef.current;
    if (!root) return;
    const trigger = eventTrigger(event.target, event.currentTarget, root);
    if (!trigger || !isEligibleTrigger(trigger, root)) return;

    const list = event.currentTarget;
    const triggers = ownedTriggers(list, root);
    const index = triggers.indexOf(trigger);
    if (index < 0) return;
    const rtl = getComputedStyle(list).direction === 'rtl';
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight')
      nextIndex = (index + (rtl ? -1 : 1) + triggers.length) % triggers.length;
    if (event.key === 'ArrowLeft')
      nextIndex = (index + (rtl ? 1 : -1) + triggers.length) % triggers.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = triggers.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    const next = triggers[nextIndex];
    next.focus();
    revealTriggerInset(list, next);
    context.onChange?.(next.dataset.value!);
  };

  return (
    <div
      {...rest}
      ref={setListNode}
      className={cx('lyra-tabs', context.variant === 'pills' && 'lyra-tabs--pills', className)}
      role="tablist"
      tabIndex={-1}
      onClick={requestClick}
      onKeyDown={requestKeyDown}
    >
      {children}
    </div>
  );
});

/** A native tab trigger. */
export const TabsTrigger = /*#__PURE__*/ forwardRef<HTMLButtonElement, TabsTriggerProps>(
  function TabsTrigger({ value, count, icon, className, children, ...rest }, ref) {
    const context = useTabsContext('TabsTrigger');
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const selected = context.active === value;
    const tabIndex =
      context.entryValue === null ? (selected ? 0 : -1) : context.entryValue === value ? 0 : -1;

    const setTriggerNode = useCallback(
      (node: HTMLButtonElement | null): void => {
        triggerRef.current = node;
        setForwardedRef(ref, node);
      },
      [ref],
    );

    useIsomorphicLayoutEffect(() => {
      const trigger = triggerRef.current;
      const root = context.rootRef.current;
      const list = trigger?.closest<HTMLDivElement>('[role="tablist"]');
      if (trigger && root && list && isOwnedByRoot(list, root)) context.normalizeEntry(list);
    });

    return (
      <button
        {...rest}
        ref={setTriggerNode}
        id={partId(context.rootId, 'tab', value)}
        type="button"
        role="tab"
        data-value={value}
        data-state={selected ? 'active' : 'inactive'}
        aria-selected={selected}
        aria-controls={partId(context.rootId, 'panel', value)}
        tabIndex={tabIndex}
        className={cx('lyra-tab', selected && 'lyra-tab--active', className)}
      >
        {icon}
        {children}
        {count != null && <span className="lyra-tab__count">{count}</span>}
      </button>
    );
  },
);

/** A mounted consumer-owned tab panel. */
export const TabsContent = /*#__PURE__*/ forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ value, children, ...rest }, ref) {
    const context = useTabsContext('TabsContent');
    const selected = context.active === value;

    return (
      <div
        {...rest}
        ref={ref}
        id={partId(context.rootId, 'panel', value)}
        role="tabpanel"
        data-state={selected ? 'active' : 'inactive'}
        aria-labelledby={partId(context.rootId, 'tab', value)}
        tabIndex={0}
        hidden={!selected}
      >
        {children}
      </div>
    );
  },
);
