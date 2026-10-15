'use client';

import {
  AppSidebar,
  AppSidebarOffcanvas,
  AppSidebarTrigger,
  Avatar,
  Button,
  Icon,
  Shell,
  SidebarGroup,
  Tooltip,
  WorkspaceSwitcher,
} from '@lyra-ds/react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import type { MouseEvent } from 'react';

export function AppSidebarComposition() {
  const locale = useLocale();
  const id = useId();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [compact, setCompact] = useState(true);
  const [workspace, setWorkspace] = useState('acme');
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reconcileFocus = useRef(false);
  const navId = `${id}-navigation`;
  const panelId = `${id}-panel`;

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const reconcile = () => {
      reconcileFocus.current = Boolean(
        media.matches && navRef.current?.contains(navRef.current.ownerDocument.activeElement),
      );
      setMobile(media.matches);
      setMobileOpen(false);
    };
    reconcile();
    media.addEventListener('change', reconcile);
    return () => media.removeEventListener('change', reconcile);
  }, []);

  useEffect(() => {
    if (reconcileFocus.current) {
      reconcileFocus.current = false;
      triggerRef.current?.focus({ preventScroll: true });
    }
  }, [mobile]);

  const closeAfterNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      !event.defaultPrevented &&
      event.button === 0 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey
    ) {
      setMobileOpen(false);
    }
  };
  const destinations = [
    { slug: 'app-sidebar', label: 'Overview', icon: 'house' },
    { slug: 'data-table', label: 'Projects', icon: 'folder' },
    { slug: 'calendar-view', label: 'Schedule', icon: 'calendar' },
    { slug: 'file-manager', label: 'Files', icon: 'file' },
    { slug: 'person-cell', label: 'People', icon: 'users' },
    { slug: 'stat', label: 'Activity', icon: 'chart-line' },
    { slug: 'toast', label: 'Notifications', icon: 'bell' },
    { slug: 'input', label: 'Workspace settings', icon: 'settings' },
    { slug: 'tabs', label: 'Saved views', icon: 'folder' },
    { slug: 'table', label: 'Reports', icon: 'chart-line' },
    { slug: 'avatar', label: 'Team directory', icon: 'users' },
    { slug: 'badge', label: 'Project labels', icon: 'file' },
    { slug: 'calendar', label: 'Team availability', icon: 'calendar' },
    { slug: 'dropdown', label: 'Quick actions', icon: 'list' },
    { slug: 'code-block', label: 'Developer resources', icon: 'book-open' },
    { slug: 'button', label: 'Workspace tools', icon: 'settings' },
  ] as const;
  const navigation = (inPanel: boolean) => {
    const collapsed = !inPanel && desktopCollapsed;
    return (
      <AppSidebar
        ref={inPanel ? undefined : navRef}
        id={inPanel ? `${id}-mobile-navigation` : navId}
        aria-label="Acme application navigation"
        width={240}
        collapsed={collapsed}
        density={compact ? 'compact' : 'default'}
        railTooltips
        brand={
          <WorkspaceSwitcher
            current={workspace}
            onChange={setWorkspace}
            workspaces={[
              { id: 'acme', name: 'Acme', plan: 'Pro', members: 12 },
              { id: 'studio', name: 'Acme Design Studio', plan: 'Team', members: 6 },
            ]}
          />
        }
        footer={
          <a
            className="lyra-appsidebar__user"
            href={`/${locale}/components/avatar`}
            onClick={closeAfterNavigation}
            aria-label="Alex Morgan account"
          >
            <Avatar name="Alex Morgan" size="sm" />
            {!collapsed && (
              <span>
                <span className="lyra-appsidebar__user-name">Alex Morgan</span>
                <br />
                <span className="lyra-appsidebar__user-role">Workspace admin</span>
              </span>
            )}
          </a>
        }
      >
        <SidebarGroup label="Workspace">
          {destinations.map(({ slug, label, icon }, index) => {
            const link = (
              <Link
                className={`lyra-sbgroup__item${index === 0 ? ' lyra-sbgroup__item--active' : ''}`}
                href={`/${locale}/components/${slug}`}
                aria-current={index === 0 ? 'page' : undefined}
                aria-label={label}
                onClick={closeAfterNavigation}
              >
                <span className="lyra-sbgroup__item-icon">
                  <Icon name={icon} size={16} />
                </span>
                <span className="lyra-sbgroup__item-label">{label}</span>
                {slug === 'data-table' && <span className="lyra-sbgroup__item-badge">12</span>}
              </Link>
            );
            return collapsed ? (
              <Tooltip
                key={slug}
                tip={label}
                placement="right"
                escapeClipping
                className="lyra-appsidebar__hint"
              >
                {link}
              </Tooltip>
            ) : (
              <span key={slug}>{link}</span>
            );
          })}
        </SidebarGroup>
        <SidebarGroup label="Resources">
          <Link
            className="lyra-sbgroup__item"
            href={`/${locale}/guides/compatibility`}
            onClick={closeAfterNavigation}
          >
            <span className="lyra-sbgroup__item-icon">
              <Icon name="book-open" size={16} />
            </span>
            <span className="lyra-sbgroup__item-label">Compatibility guide</span>
          </Link>
        </SidebarGroup>
      </AppSidebar>
    );
  };

  return (
    <div ref={setContainer} className="lw-appsidebar-demo">
      <Shell
        mainAs="div"
        scroll="content"
        sidebarAs="div"
        sidebar={mobile ? undefined : navigation(false)}
        topbar={
          <>
            <AppSidebarTrigger
              ref={triggerRef}
              controls={mobile ? panelId : navId}
              collapsed={mobile ? !mobileOpen : desktopCollapsed}
              onCollapsedChange={mobile ? (value) => setMobileOpen(!value) : setDesktopCollapsed}
              label={mobile ? 'Toggle application navigation' : 'Toggle navigation rail'}
              hotkey
            />
            <strong>Workspace overview</strong>
          </>
        }
      >
        <div ref={contentRef} tabIndex={-1} className="lw-appsidebar-demo__content">
          <h3>A place for your team's work</h3>
          <p>
            Move between projects, people and files. This embedded shell links to the corresponding
            Lyra component pages.
          </p>
          <Button
            variant="secondary"
            size="sm"
            aria-pressed={compact}
            onClick={() => setCompact(!compact)}
          >
            Compact rows
          </Button>
          <p>
            Use the topbar control or <kbd>⌘ / Ctrl + B</kbd> to{' '}
            {mobile ? 'open navigation' : 'switch between the expanded sidebar and icon rail'}. Your
            desktop preference stays in place when the viewport changes.
          </p>
          <p>
            Navigation scrolls between the workspace switcher and your account. Open the switcher to
            try a second workspace.
          </p>
        </div>
      </Shell>
      <AppSidebarOffcanvas
        id={panelId}
        title="Application navigation"
        open={mobile && mobileOpen}
        onClose={() => setMobileOpen(false)}
        container={container ?? undefined}
        returnFocusTo={() => triggerRef.current ?? contentRef.current}
      >
        {navigation(true)}
      </AppSidebarOffcanvas>
    </div>
  );
}
