import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { Avatar } from '../avatar';
import { Icon } from '../icon';
import { cx } from '../internal/cx';
import { useFlipPlacement } from '../internal/use-flip-placement';

/** A workspace listed in {@link WorkspaceSwitcher}. */
export interface Workspace {
  /** Stable workspace identifier. */
  id: string;
  /** Workspace name. */
  name: string;
  /** Optional subscription plan shown beneath the name. */
  plan?: string;
  /** Optional member count shown in the popover. */
  members?: number;
}

/** Props for {@link WorkspaceSwitcher}. */
export interface WorkspaceSwitcherProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Workspaces available for selection. */
  workspaces?: Workspace[];
  /** Identifier of the current workspace. Defaults to the first workspace. */
  current?: string;
  /** Called when a workspace is selected. */
  onChange?: (id: string, workspace: Workspace) => void;
  /** When present, shows a create-workspace action in the popover. */
  onCreate?: () => void;
  /** Create-action label. Default `"Create workspace"`. */
  createLabel?: string;
  /** Whether the popover starts open. Useful for demos. */
  defaultOpen?: boolean;
}

/** A listbox-style workspace chooser with real-focus keyboard navigation. */
export const WorkspaceSwitcher = /*#__PURE__*/ forwardRef<HTMLDivElement, WorkspaceSwitcherProps>(
  function WorkspaceSwitcher(
    {
      workspaces = [],
      current,
      onChange,
      onCreate,
      createLabel = 'Create workspace',
      defaultOpen = false,
      id,
      className,
      onKeyDown,
      ...rest
    },
    forwardedRef,
  ) {
    const generatedId = useId();
    const rootId = id ?? generatedId;
    const listboxId = `${rootId}-listbox`;
    const listboxLabelId = `${rootId}-listbox-label`;
    const [open, setOpen] = useState(defaultOpen);
    const [pendingFocus, setPendingFocus] = useState<'workspace' | 'create' | null>(null);
    const [focusedWorkspaceId, setFocusedWorkspaceId] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const placement = useFlipPlacement(open, triggerRef, popoverRef);
    const selected = workspaces.find((workspace) => workspace.id === current) ?? workspaces[0];
    const rovingWorkspaceId = workspaces.some((workspace) => workspace.id === focusedWorkspaceId)
      ? focusedWorkspaceId
      : selected?.id;

    const optionButtons = (): HTMLButtonElement[] =>
      Array.from(popoverRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);

    const close = (restoreFocus = false): void => {
      setOpen(false);
      setPendingFocus(null);
      if (restoreFocus) triggerRef.current?.focus();
    };

    const openWithFocus = (): void => {
      setPendingFocus(workspaces.length > 0 ? 'workspace' : onCreate ? 'create' : null);
      setOpen(true);
    };

    useEffect(() => {
      if (!open || pendingFocus === null) return;
      const options = optionButtons();
      if (pendingFocus === 'workspace' && options.length > 0) {
        const selectedIndex = options.findIndex(
          (option) => option.getAttribute('aria-selected') === 'true',
        );
        // preventScroll: the popover is already placed to fit; focusing an option must not scroll.
        options[Math.max(selectedIndex, 0)]?.focus({ preventScroll: true });
      } else if (pendingFocus === 'create') {
        popoverRef.current?.querySelector<HTMLButtonElement>('.lyra-wssw__create')?.focus({
          preventScroll: true,
        });
      }
      setPendingFocus(null);
    }, [open, pendingFocus]);

    useEffect(() => {
      if (!open) return;
      const onDocumentMouseDown = (event: MouseEvent): void => {
        if (rootRef.current && !rootRef.current.contains(event.target as Node)) close();
      };
      document.addEventListener('mousedown', onDocumentMouseDown);
      return () => document.removeEventListener('mousedown', onDocumentMouseDown);
    }, [open]);

    const handleTriggerKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape' && open) {
        event.preventDefault();
        close(true);
        return;
      }
      if (
        event.key === 'Enter' ||
        event.key === ' ' ||
        event.key === 'ArrowDown' ||
        event.key === 'ArrowUp'
      ) {
        event.preventDefault();
        openWithFocus();
      }
    };

    const optionForTarget = (target: EventTarget | null): HTMLButtonElement | null => {
      if (!(target instanceof Element)) return null;
      const option = target.closest<HTMLButtonElement>('[role="option"]');
      return option && popoverRef.current?.contains(option) ? option : null;
    };

    const createForTarget = (target: EventTarget | null): HTMLButtonElement | null => {
      if (!(target instanceof Element)) return null;
      const create = target.closest<HTMLButtonElement>('.lyra-wssw__create');
      return create && popoverRef.current?.contains(create) ? create : null;
    };

    const handleOptionKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
      if (event.defaultPrevented) return;
      const option = optionForTarget(event.target);
      if (!option) return;
      const options = optionButtons();
      const currentIndex = options.indexOf(option);
      if (currentIndex < 0 || options.length === 0) return;
      let nextIndex: number | undefined;
      if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
      if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = options.length - 1;
      if (nextIndex !== undefined) {
        event.preventDefault();
        options[nextIndex]?.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'Tab' && (event.shiftKey || !onCreate)) {
        close();
      }
    };

    const handleCreateKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
      if (event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key === 'Tab') {
        if (!event.shiftKey || optionButtons().length === 0) close();
      }
    };

    const attachRoot = (node: HTMLDivElement | null): void => {
      rootRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    return (
      // The root owns keyboard defaults so consumers can cancel the original event first.
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        {...rest}
        ref={attachRoot}
        id={rootId}
        className={cx('lyra-wssw', className)}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          if (triggerRef.current?.contains(event.target as Node)) handleTriggerKeyDown(event);
          else if (optionForTarget(event.target)) handleOptionKeyDown(event);
          else if (createForTarget(event.target)) handleCreateKeyDown(event);
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          tabIndex={0}
          className="lyra-wssw__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => (open ? close() : openWithFocus())}
        >
          <Avatar name={selected?.name ?? '?'} size="sm" shape="square" />
          <span className="lyra-wssw__id">
            <span className="lyra-wssw__name">{selected?.name ?? 'Select workspace'}</span>
            {selected?.plan && <span className="lyra-wssw__plan">{selected.plan}</span>}
          </span>
          <Icon name="chevrons-up-down" size={15} color="var(--text-faint)" />
        </button>
        {open && (
          <div
            ref={popoverRef}
            className={cx('lyra-wssw__pop', placement.side === 'up' && 'lyra-wssw__pop--up')}
          >
            <span id={listboxLabelId} className="lyra-wssw__pop-label">
              Workspaces
            </span>
            <div id={listboxId} role="listbox" aria-labelledby={listboxLabelId}>
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  role="option"
                  aria-selected={workspace.id === selected?.id}
                  tabIndex={workspace.id === rovingWorkspaceId ? 0 : -1}
                  className="lyra-wssw__item"
                  onFocus={() => setFocusedWorkspaceId(workspace.id)}
                  onClick={() => {
                    onChange?.(workspace.id, workspace);
                    close(true);
                  }}
                >
                  <Avatar name={workspace.name} size="sm" shape="square" />
                  <span className="lyra-wssw__id">
                    <span className="lyra-wssw__name">{workspace.name}</span>
                    {(workspace.plan || workspace.members !== undefined) && (
                      <span className="lyra-wssw__meta">
                        {[
                          workspace.plan,
                          workspace.members !== undefined ? `${workspace.members} members` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    )}
                  </span>
                  {workspace.id === selected?.id && (
                    <Icon name="check" size={15} color="var(--accent)" />
                  )}
                </button>
              ))}
            </div>
            {onCreate && (
              <>
                <hr className="lyra-wssw__sep" role="presentation" />
                <button
                  type="button"
                  tabIndex={0}
                  className="lyra-wssw__item lyra-wssw__create"
                  onClick={() => {
                    onCreate();
                    close(true);
                  }}
                >
                  <span className="lyra-wssw__plus">
                    <Icon name="plus" size={15} />
                  </span>
                  <span className="lyra-wssw__create-label">{createLabel}</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  },
);
