import type { FileUploadError, FileUploadItem, FileUploadMessages } from './file-upload.types';

function matchesAccept(file: Pick<File, 'name' | 'type'>, accept: string): boolean {
  let hasSupportedToken = false;

  for (const token of accept.split(',').map((value) => value.trim())) {
    if (/^\.[^\s,/]+$/.test(token)) {
      hasSupportedToken = true;
      if (file.name.toLowerCase().endsWith(token.toLowerCase())) return true;
      continue;
    }

    if (token === 'audio/*' || token === 'video/*' || token === 'image/*') {
      hasSupportedToken = true;
      if (file.type.startsWith(token.slice(0, -1))) return true;
      continue;
    }

    if (/^[!#$%&'+.^_`|~0-9A-Za-z-]+\/[!#$%&'+.^_`|~0-9A-Za-z-]+$/.test(token)) {
      hasSupportedToken = true;
      if (file.type === token) return true;
    }
  }

  return !hasSupportedToken;
}

export function validateFile(
  file: Pick<File, 'name' | 'size' | 'type'>,
  { accept, maxSizeMB }: { accept?: string; maxSizeMB?: number },
  messages: Pick<Required<FileUploadMessages>, 'validationAccept' | 'validationMaxSize'>,
): Extract<FileUploadError, { kind: 'validation' }> | null {
  if (accept && !matchesAccept(file, accept)) {
    return {
      kind: 'validation',
      code: 'accept',
      message: messages.validationAccept(file.name, accept),
      retryable: false,
    };
  }
  if (maxSizeMB !== undefined && file.size > maxSizeMB * 1_000_000) {
    return {
      kind: 'validation',
      code: 'max-size',
      message: messages.validationMaxSize(file.name, maxSizeMB),
      retryable: false,
    };
  }
  return null;
}

export function isActive(item: FileUploadItem): boolean {
  return item.status === 'uploading' || item.status === 'canceling';
}

export function canRetry(item: FileUploadItem): boolean {
  return item.status === 'canceled' || (item.status === 'error' && item.error.retryable);
}

export function canRemove(item: FileUploadItem): boolean {
  return !isActive(item);
}

export function progressMilestone(previous: number, next: number): 25 | 50 | 75 | 100 | null {
  return ([100, 75, 50, 25] as const).find((value) => previous < value && next >= value) ?? null;
}

export type FileUploadIntentKey = string;
export interface FileUploadAttemptRecord {
  attemptIds: readonly string[];
  latestItem: FileUploadItem | null;
}
export type FileUploadAttemptHistory = ReadonlyMap<string, FileUploadAttemptRecord>;
export type FileUploadAnnouncementHistory = ReadonlyMap<string, ReadonlySet<string>>;

export function itemAttemptId(item: FileUploadItem): string | null {
  return 'attemptId' in item ? item.attemptId : null;
}

export function identityKey(...parts: readonly (string | number | null)[]): string {
  return JSON.stringify(parts);
}

export function intentKey(item: FileUploadItem): FileUploadIntentKey {
  return identityKey(item.id, item.status, itemAttemptId(item));
}

export function pruneAnnouncementHistory(
  history: FileUploadAnnouncementHistory,
  items: readonly FileUploadItem[],
): Map<string, Set<string>> {
  const nextHistory = new Map<string, Set<string>>();

  for (const item of items) {
    if (item.status === 'uploading') continue;
    const currentKey = identityKey(item.id, itemAttemptId(item), item.status);
    if (history.get(item.id)?.has(currentKey)) {
      nextHistory.set(item.id, new Set([currentKey]));
    }
  }

  return nextHistory;
}

export function reconcileAttemptHistory(
  items: readonly FileUploadItem[],
  previousHistory: FileUploadAttemptHistory,
): { history: FileUploadAttemptHistory; visibleItems: readonly FileUploadItem[] } {
  let nextHistory: Map<string, FileUploadAttemptRecord> | null = null;
  const visibleItems: FileUploadItem[] = [];
  const itemIds = new Set(items.map((item) => item.id));

  for (const [id, record] of previousHistory) {
    if (itemIds.has(id) || record.latestItem === null) continue;
    nextHistory ??= new Map(previousHistory);
    nextHistory.set(id, { attemptIds: record.attemptIds, latestItem: null });
  }

  for (const item of items) {
    const attemptId = itemAttemptId(item);
    if (attemptId === null) {
      visibleItems.push(item);
      continue;
    }

    const record = (nextHistory ?? previousHistory).get(item.id);
    const knownAttempts = record?.attemptIds ?? [];
    const latestAttempt = knownAttempts.at(-1);
    if (record?.latestItem === null && knownAttempts.includes(attemptId)) continue;
    if (latestAttempt === attemptId) {
      visibleItems.push(item);
      if (record?.latestItem !== item) {
        nextHistory ??= new Map(previousHistory);
        nextHistory.set(item.id, { attemptIds: knownAttempts, latestItem: item });
      }
      continue;
    }
    if (knownAttempts.includes(attemptId)) {
      if (record?.latestItem !== null && record?.latestItem !== undefined) {
        visibleItems.push(record.latestItem);
      }
      continue;
    }

    nextHistory ??= new Map(previousHistory);
    nextHistory.set(item.id, { attemptIds: [...knownAttempts, attemptId], latestItem: item });
    visibleItems.push(item);
  }

  return { history: nextHistory ?? previousHistory, visibleItems };
}
