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

    if (/^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(token)) {
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
