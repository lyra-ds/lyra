import { Fragment, forwardRef, useState } from 'react';
import type { IconName } from '../icon';
import { Icon } from '../icon';
import { Dropdown } from '../dropdown';
import type { DropdownItem } from '../dropdown';
import { cx } from '../internal/cx';
import { useControllableState } from '../internal/use-controllable-state';

/** A folder or document displayed by {@link FileManager}. */
export interface ManagedFile {
  /** Stable file identifier. */
  id: string;
  /** File or folder name. */
  name: string;
  /** Marks this item as a folder. Folders appear before documents. */
  type?: 'folder';
  /** File size in bytes. */
  size?: number;
  /** Number of items in a folder. */
  items?: number;
  /** Free-form modification description. */
  updated?: string;
  /** Whether the item has been shared. */
  shared?: boolean;
}

/** Accessible names for the FileManager chrome. Merged over the defaults, so partial objects work. */
export interface FileManagerLabels {
  /** Name of the `role="group"` around the view toggle. Default: `"View mode"`. */
  viewMode?: string;
  /** List-view button. Default: `"List view"`. */
  listView?: string;
  /** Grid-view button. Default: `"Grid view"`. */
  gridView?: string;
  /** Breadcrumb landmark for the current folder. Default: `"Current folder"`. */
  currentFolder?: string;
  /** Per-item action trigger. Receives the file name. Default: `` (name) => `Actions for ${name}` ``. */
  itemActions?: (name: string) => string;
}

const DEFAULT_FM_LABELS: Required<FileManagerLabels> = {
  viewMode: 'View mode',
  listView: 'List view',
  gridView: 'Grid view',
  currentFolder: 'Current folder',
  itemActions: (name) => `Actions for ${name}`,
};

/** Props for {@link FileManager}. */
export interface FileManagerProps {
  /** Files and folders to display. */
  files?: ManagedFile[];
  /** Breadcrumb segments for the current folder. */
  path?: string[];
  /** Controlled display mode. */
  view?: 'list' | 'grid';
  /** Initial display mode when uncontrolled. Default: `"list"`. */
  defaultView?: 'list' | 'grid';
  /** Called after the display mode changes. */
  onViewChange?: (view: 'list' | 'grid') => void;
  /** Called when a file name or grid card is opened. */
  onOpen?: (file: ManagedFile) => void;
  /** Called with the selected breadcrumb segment index. */
  onNavigate?: (index: number) => void;
  /** Builds the action menu for an item, replacing the default commands. */
  actions?: (file: ManagedFile) => DropdownItem[];
  /** Placeholder shown in the file search field. */
  searchPlaceholder?: string;
  /** Message shown when no files match the search. */
  emptyMessage?: string;
  /** Accessible names for the FileManager chrome. Merged over the defaults, so partial objects work. */
  labels?: FileManagerLabels;
  /** Class appended after the public `.lyra-fm` class. */
  className?: string;
}

function fmFormatBytes(n: number | undefined): string {
  if (n == null) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function fmIconFor(file: ManagedFile): IconName {
  if (file.type === 'folder') return 'folder';
  const ext = (file.name || '').split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext ?? '')) return 'image';
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext ?? '')) return 'file-text';
  if (['xls', 'xlsx', 'csv'].includes(ext ?? '')) return 'file-spreadsheet';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext ?? '')) return 'file-archive';
  if (['mp4', 'mov', 'webm'].includes(ext ?? '')) return 'film';
  if (['mp3', 'wav', 'ogg'].includes(ext ?? '')) return 'music';
  return 'file';
}

function defaultActions(file: ManagedFile): DropdownItem[] {
  void file;
  return [
    { id: 'open', label: 'Open', icon: <Icon name="external-link" size={15} /> },
    { id: 'rename', label: 'Rename', icon: <Icon name="pencil" size={15} /> },
    { id: 'download', label: 'Download', icon: <Icon name="download" size={15} /> },
    { type: 'separator' },
    { id: 'delete', label: 'Delete', icon: <Icon name="trash-2" size={15} />, danger: true },
  ];
}

/**
 * A searchable file browser with list and grid views, folder breadcrumbs, and per-item action
 * menus. It is controlled when `view` is defined and otherwise manages its own display mode.
 */
export const FileManager = /*#__PURE__*/ forwardRef<HTMLDivElement, FileManagerProps>(
  function FileManager(
    {
      files = [],
      path = [],
      view,
      defaultView = 'list',
      onViewChange,
      onOpen,
      onNavigate,
      actions,
      searchPlaceholder = 'Search files…',
      emptyMessage = 'No files found.',
      labels: labelsProp,
      className,
    },
    ref,
  ) {
    const [query, setQuery] = useState('');
    const [currentView, setCurrentView] = useControllableState<'list' | 'grid'>({
      value: view,
      defaultValue: defaultView,
      onChange: onViewChange,
    });
    const normalizedQuery = query.toLowerCase();
    const labels = { ...DEFAULT_FM_LABELS, ...labelsProp };
    const visible = files.filter(
      (file) => !normalizedQuery || file.name.toLowerCase().includes(normalizedQuery),
    );
    const ordered = [
      ...visible.filter((file) => file.type === 'folder'),
      ...visible.filter((file) => file.type !== 'folder'),
    ];

    const renderActions = (file: ManagedFile) => (
      <Dropdown
        align="end"
        trigger={
          <span className="lyra-fm__more" aria-label={labels.itemActions(file.name)}>
            <Icon name="ellipsis" size={17} />
          </span>
        }
        items={actions ? actions(file) : defaultActions(file)}
      />
    );

    return (
      <div ref={ref} className={cx('lyra-fm', className)}>
        <div className="lyra-fm__toolbar">
          <div className="lyra-fm__search">
            <Icon name="search" size={15} color="var(--text-faint)" />
            <input
              value={query}
              placeholder={searchPlaceholder}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="lyra-fm__views" role="group" aria-label={labels.viewMode}>
            <button
              type="button"
              className={cx('lyra-fm__view', currentView === 'list' && 'lyra-fm__view--on')}
              aria-pressed={currentView === 'list'}
              aria-label={labels.listView}
              onClick={() => setCurrentView('list')}
            >
              <Icon name="list" size={15} />
            </button>
            <button
              type="button"
              className={cx('lyra-fm__view', currentView === 'grid' && 'lyra-fm__view--on')}
              aria-pressed={currentView === 'grid'}
              aria-label={labels.gridView}
              onClick={() => setCurrentView('grid')}
            >
              <Icon name="layout-grid" size={15} />
            </button>
          </div>
        </div>
        {path.length > 0 && (
          <nav className="lyra-fm__path" aria-label={labels.currentFolder}>
            {path.map((segment, index) => (
              <Fragment key={`${segment}-${index}`}>
                {index > 0 && <Icon name="chevron-right" size={13} color="var(--text-faint)" />}
                <button
                  type="button"
                  className="lyra-fm__crumb"
                  onClick={() => onNavigate?.(index)}
                  disabled={index === path.length - 1}
                >
                  {index === 0 && <Icon name="folder-open" size={15} />}
                  {segment}
                </button>
              </Fragment>
            ))}
          </nav>
        )}
        {ordered.length === 0 ? (
          <p className="lyra-fm__empty">{emptyMessage}</p>
        ) : currentView === 'list' ? (
          <ul className="lyra-fm__list">
            <li className="lyra-fm__head" aria-hidden="true">
              <span>Name</span>
              <span>Size</span>
              <span>Modified</span>
              <span />
            </li>
            {ordered.map((file) => (
              <li className="lyra-fm__row" key={file.id}>
                <button type="button" className="lyra-fm__name" onClick={() => onOpen?.(file)}>
                  <span
                    className={cx(
                      'lyra-fm__icon',
                      file.type === 'folder' && 'lyra-fm__icon--folder',
                    )}
                  >
                    <Icon name={fmIconFor(file)} size={17} />
                  </span>
                  <span className="lyra-fm__label">{file.name}</span>
                  {file.shared && (
                    <span className="lyra-fm__shared">
                      <Icon name="users" size={13} />
                    </span>
                  )}
                </button>
                <span className="lyra-fm__cell">
                  {file.type === 'folder' ? `${file.items ?? '—'} items` : fmFormatBytes(file.size)}
                </span>
                <span className="lyra-fm__cell">{file.updated || '—'}</span>
                <span className="lyra-fm__actions">{renderActions(file)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="lyra-fm__grid">
            {ordered.map((file) => (
              <div className="lyra-fm__card" key={file.id}>
                <span className="lyra-fm__card-actions">{renderActions(file)}</span>
                <button type="button" className="lyra-fm__card-body" onClick={() => onOpen?.(file)}>
                  <span
                    className={cx(
                      'lyra-fm__icon',
                      'lyra-fm__icon--big',
                      file.type === 'folder' && 'lyra-fm__icon--folder',
                    )}
                  >
                    <Icon name={fmIconFor(file)} size={26} />
                  </span>
                  <span className="lyra-fm__label">{file.name}</span>
                  <span className="lyra-fm__card-meta">
                    {file.type === 'folder'
                      ? `${file.items ?? '—'} items`
                      : fmFormatBytes(file.size)}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);
