import { Fragment, forwardRef, useState } from 'react';
import {
  ChevronRight,
  Download,
  Ellipsis,
  ExternalLink,
  File,
  FileArchive,
  FileSpreadsheet,
  FileText,
  Film,
  Folder,
  FolderOpen,
  Image,
  LayoutGrid,
  List,
  Music,
  Pencil,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
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

/** Labels for the FileManager chrome — accessible names and visible text. Merged over the defaults, so partial objects work. */
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
  /** List header for file names. Default: `"Name"`. */
  headerName?: string;
  /** List header for file sizes. Default: `"Size"`. */
  headerSize?: string;
  /** List header for modification dates. Default: `"Modified"`. */
  headerModified?: string;
  /** Default menu label for opening a file. Default: `"Open"`. */
  menuOpen?: string;
  /** Default menu label for renaming a file. Default: `"Rename"`. */
  menuRename?: string;
  /** Default menu label for downloading a file. Default: `"Download"`. */
  menuDownload?: string;
  /** Default menu label for deleting a file. Default: `"Delete"`. */
  menuDelete?: string;
  /** Folder item-count text. Receives the item count. Default: `` (n) => `${n ?? '—'} items` ``. */
  itemsCount?: (items: number | undefined) => string;
}

const DEFAULT_FM_LABELS: Required<FileManagerLabels> = {
  viewMode: 'View mode',
  listView: 'List view',
  gridView: 'Grid view',
  currentFolder: 'Current folder',
  itemActions: (name) => `Actions for ${name}`,
  headerName: 'Name',
  headerSize: 'Size',
  headerModified: 'Modified',
  menuOpen: 'Open',
  menuRename: 'Rename',
  menuDownload: 'Download',
  menuDelete: 'Delete',
  itemsCount: (items) => `${items ?? '—'} items`,
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
  /** Labels for the FileManager chrome — accessible names and visible text. Merged over the defaults, so partial objects work. */
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

function FileManagerIcon({ file, size }: { file: ManagedFile; size: number }) {
  if (file.type === 'folder') {
    return <Folder className="lyra-icon" size={size} aria-hidden="true" />;
  }

  const ext = (file.name || '').split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext ?? '')) {
    return <Image className="lyra-icon" size={size} aria-hidden="true" />;
  }
  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext ?? '')) {
    return <FileText className="lyra-icon" size={size} aria-hidden="true" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext ?? '')) {
    return <FileSpreadsheet className="lyra-icon" size={size} aria-hidden="true" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext ?? '')) {
    return <FileArchive className="lyra-icon" size={size} aria-hidden="true" />;
  }
  if (['mp4', 'mov', 'webm'].includes(ext ?? '')) {
    return <Film className="lyra-icon" size={size} aria-hidden="true" />;
  }
  if (['mp3', 'wav', 'ogg'].includes(ext ?? '')) {
    return <Music className="lyra-icon" size={size} aria-hidden="true" />;
  }

  return <File className="lyra-icon" size={size} aria-hidden="true" />;
}

function defaultActions(file: ManagedFile, labels: Required<FileManagerLabels>): DropdownItem[] {
  void file;
  return [
    {
      id: 'open',
      label: labels.menuOpen,
      icon: <ExternalLink className="lyra-icon" size={15} aria-hidden="true" />,
    },
    {
      id: 'rename',
      label: labels.menuRename,
      icon: <Pencil className="lyra-icon" size={15} aria-hidden="true" />,
    },
    {
      id: 'download',
      label: labels.menuDownload,
      icon: <Download className="lyra-icon" size={15} aria-hidden="true" />,
    },
    { type: 'separator' },
    {
      id: 'delete',
      label: labels.menuDelete,
      icon: <Trash2 className="lyra-icon" size={15} aria-hidden="true" />,
      danger: true,
    },
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
            <Ellipsis className="lyra-icon" size={17} aria-hidden="true" />
          </span>
        }
        items={actions ? actions(file) : defaultActions(file, labels)}
      />
    );

    return (
      <div ref={ref} className={cx('lyra-fm', className)}>
        <div className="lyra-fm__toolbar">
          <div className="lyra-fm__search">
            <Search className="lyra-icon" size={15} color="var(--text-faint)" aria-hidden="true" />
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
              <List className="lyra-icon" size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={cx('lyra-fm__view', currentView === 'grid' && 'lyra-fm__view--on')}
              aria-pressed={currentView === 'grid'}
              aria-label={labels.gridView}
              onClick={() => setCurrentView('grid')}
            >
              <LayoutGrid className="lyra-icon" size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
        {path.length > 0 && (
          <nav className="lyra-fm__path" aria-label={labels.currentFolder}>
            {path.map((segment, index) => (
              <Fragment key={`${segment}-${index}`}>
                {index > 0 && (
                  <ChevronRight
                    className="lyra-icon"
                    size={13}
                    color="var(--text-faint)"
                    aria-hidden="true"
                  />
                )}
                <button
                  type="button"
                  className="lyra-fm__crumb"
                  onClick={() => onNavigate?.(index)}
                  disabled={index === path.length - 1}
                >
                  {index === 0 && <FolderOpen className="lyra-icon" size={15} aria-hidden="true" />}
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
              <span>{labels.headerName}</span>
              <span>{labels.headerSize}</span>
              <span>{labels.headerModified}</span>
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
                    <FileManagerIcon file={file} size={17} />
                  </span>
                  <span className="lyra-fm__label">{file.name}</span>
                  {file.shared && (
                    <span className="lyra-fm__shared">
                      <Users className="lyra-icon" size={13} aria-hidden="true" />
                    </span>
                  )}
                </button>
                <span className="lyra-fm__cell">
                  {file.type === 'folder'
                    ? labels.itemsCount(file.items)
                    : fmFormatBytes(file.size)}
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
                    <FileManagerIcon file={file} size={26} />
                  </span>
                  <span className="lyra-fm__label">{file.name}</span>
                  <span className="lyra-fm__card-meta">
                    {file.type === 'folder'
                      ? labels.itemsCount(file.items)
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
