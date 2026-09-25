import { forwardRef, useEffect, useId, useRef, useState } from 'react';
import type { HTMLAttributes, KeyboardEvent } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Avatar } from '../avatar';
import { cx } from '../internal/cx';
import { focusPopupItem, useFlipPlacement } from '../internal/use-flip-placement';

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
  /** Destination for navigation. When set, this workspace renders as a native link. */
  href?: string;
}

/** Translatable text, merged over the English defaults. */
export interface WorkspaceSwitcherLabels {
  /** Heading for the workspace choices. */
  listLabel?: string;
  /** Trigger text when there is no workspace. */
  placeholder?: string;
  /** Formats the member count with the correct locale and plural form. */
  members?: (count: number) => string;
}

const DEFAULT_LABELS: Required<WorkspaceSwitcherLabels> = {
  listLabel: 'Workspaces',
  placeholder: 'Select workspace',
  members: (count) => `${count} ${count === 1 ? 'member' : 'members'}`,
};

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
  /** Translatable text merged over English defaults. */
  labels?: WorkspaceSwitcherLabels;
  /** Whether the popover starts open. Useful for demos. */
  defaultOpen?: boolean;
}

/** A disclosure of workspace buttons and navigation links with real-focus keyboard navigation. */
export const WorkspaceSwitcher = /*#__PURE__*/ forwardRef<HTMLDivElement, WorkspaceSwitcherProps>(
  function WorkspaceSwitcher(
    {
      workspaces = [],
      current,
      onChange,
      onCreate,
      createLabel = 'Create workspace',
      labels: labelsProp,
      defaultOpen = false,
      id,
      className,
      onClick,
      onKeyDown,
      ...rest
    },
    forwardedRef,
  ) {
    const generatedId = useId();
    const rootId = id ?? generatedId;
    const popoverId = `${rootId}-popover`;
    const popoverLabelId = `${rootId}-popover-label`;
    const labels = { ...DEFAULT_LABELS, ...labelsProp };
    const [open, setOpen] = useState(defaultOpen);
    const [pendingFocus, setPendingFocus] = useState<'workspace' | 'create' | null>(null);
    const [focusedWorkspaceId, setFocusedWorkspaceId] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const placement = useFlipPlacement(open, triggerRef, popoverRef, 6, undefined, true);
    const selected = workspaces.find((workspace) => workspace.id === current) ?? workspaces[0];
    const rovingWorkspaceId = workspaces.some((workspace) => workspace.id === focusedWorkspaceId)
      ? focusedWorkspaceId
      : selected?.id;

    const optionElements = (): HTMLElement[] =>
      Array.from(
        popoverRef.current?.querySelectorAll<HTMLElement>('.lyra-wssw__item[data-id]') ?? [],
      );

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
      const options = optionElements();
      if (pendingFocus === 'workspace' && options.length > 0) {
        const selectedIndex = options.findIndex(
          (option) => option.getAttribute('aria-current') === 'true',
        );
        // Placement has already run; do not let opening focus reposition the document before the
        // flipped class is committed.
        focusPopupItem(popoverRef.current, options[Math.max(selectedIndex, 0)]);
      } else if (pendingFocus === 'create') {
        focusPopupItem(
          popoverRef.current,
          popoverRef.current?.querySelector<HTMLButtonElement>('.lyra-wssw__create'),
        );
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

    const optionForTarget = (target: EventTarget | null): HTMLElement | null => {
      if (!(target instanceof Element)) return null;
      const option = target.closest<HTMLElement>('.lyra-wssw__item[data-id]');
      return option && popoverRef.current?.contains(option) ? option : null;
    };

    const createForTarget = (target: EventTarget | null): HTMLButtonElement | null => {
      if (!(target instanceof Element)) return null;
      const create = target.closest<HTMLButtonElement>('.lyra-wssw__create');
      return create && popoverRef.current?.contains(create) ? create : null;
    };

    const workspaceForTarget = (target: EventTarget | null): Workspace | undefined => {
      const option = optionForTarget(target);
      if (!option) return undefined;
      return workspaces.find((workspace) => workspace.id === option.dataset.id);
    };

    const handleOptionKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
      if (event.defaultPrevented) return;
      const option = optionForTarget(event.target);
      if (!option) return;
      const options = optionElements();
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
        if (!event.shiftKey || optionElements().length === 0) close();
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
        onClick={(event) => {
          const workspace = workspaceForTarget(event.target);
          const isLink = optionForTarget(event.target)?.tagName === 'A';
          const isCreate = createForTarget(event.target) !== null;
          const isTrigger = triggerRef.current?.contains(event.target as Node);
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (isTrigger) {
            if (open) close();
            else openWithFocus();
          } else if (workspace) {
            if (
              isLink &&
              (event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                event.button !== 0)
            )
              return;
            if (!isLink) onChange?.(workspace.id, workspace);
            close(!isLink);
          } else if (isCreate) {
            onCreate?.();
            close(true);
          }
        }}
      >
        <button
          ref={triggerRef}
          type="button"
          tabIndex={0}
          className="lyra-wssw__trigger"
          aria-expanded={open}
          aria-controls={popoverId}
        >
          <Avatar name={selected?.name ?? '?'} size="sm" shape="square" />
          <span className="lyra-wssw__id">
            <span className="lyra-wssw__name">{selected?.name ?? labels.placeholder}</span>
            {selected?.plan && <span className="lyra-wssw__plan">{selected.plan}</span>}
          </span>
          <ChevronsUpDown
            className="lyra-icon"
            size={15}
            color="var(--text-faint)"
            aria-hidden="true"
          />
        </button>
        {open && (
          <div
            ref={popoverRef}
            id={popoverId}
            role="group"
            aria-labelledby={popoverLabelId}
            className={cx('lyra-wssw__pop', placement.side === 'up' && 'lyra-wssw__pop--up')}
          >
            <span id={popoverLabelId} className="lyra-wssw__pop-label">
              {labels.listLabel}
            </span>
            <div>
              {workspaces.map((workspace) => {
                const Item = workspace.href ? 'a' : 'button';
                return (
                  <Item
                    key={workspace.id}
                    {...(workspace.href ? { href: workspace.href } : { type: 'button' as const })}
                    data-id={workspace.id}
                    aria-current={workspace.id === selected?.id ? 'true' : undefined}
                    tabIndex={workspace.id === rovingWorkspaceId ? 0 : -1}
                    className="lyra-wssw__item"
                    onFocus={() => setFocusedWorkspaceId(workspace.id)}
                  >
                    <Avatar name={workspace.name} size="sm" shape="square" />
                    <span className="lyra-wssw__id">
                      <span className="lyra-wssw__name">{workspace.name}</span>
                      {(workspace.plan || workspace.members !== undefined) && (
                        <span className="lyra-wssw__meta">
                          {[
                            workspace.plan,
                            workspace.members !== undefined
                              ? labels.members(workspace.members)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                    </span>
                    {workspace.id === selected?.id && (
                      <Check
                        className="lyra-icon"
                        size={15}
                        color="var(--accent)"
                        aria-hidden="true"
                      />
                    )}
                  </Item>
                );
              })}
            </div>
            {onCreate && (
              <>
                <hr className="lyra-wssw__sep" role="presentation" />
                <button type="button" tabIndex={0} className="lyra-wssw__item lyra-wssw__create">
                  <span className="lyra-wssw__plus">
                    <Plus className="lyra-icon" size={15} aria-hidden="true" />
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
