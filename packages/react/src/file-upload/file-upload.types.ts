import type * as React from 'react';

export type FileUploadProgress = { kind: 'indeterminate' } | { kind: 'determinate'; value: number };

export type FileUploadError =
  | {
      kind: 'validation';
      code: 'accept' | 'max-size';
      message: string;
      retryable: false;
    }
  | {
      kind: 'transport';
      code?: string;
      message: string;
      retryable: boolean;
    };

export interface FileUploadItemBase {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface FileUploadSelectedItem extends FileUploadItemBase {
  status: 'selected';
}

export interface FileUploadUploadingItem extends FileUploadItemBase {
  status: 'uploading';
  attemptId: string;
  progress: FileUploadProgress;
}

export interface FileUploadCancelingItem extends FileUploadItemBase {
  status: 'canceling';
  attemptId: string;
  progress: FileUploadProgress;
}

export interface FileUploadSuccessItem extends FileUploadItemBase {
  status: 'success';
  attemptId: string;
}

export type FileUploadErrorItem =
  | (FileUploadItemBase & {
      status: 'error';
      error: Extract<FileUploadError, { kind: 'validation' }>;
    })
  | (FileUploadItemBase & {
      status: 'error';
      attemptId: string;
      error: Extract<FileUploadError, { kind: 'transport' }>;
    });

export interface FileUploadCanceledItem extends FileUploadItemBase {
  status: 'canceled';
  attemptId: string;
}

export type FileUploadItem =
  | FileUploadSelectedItem
  | FileUploadUploadingItem
  | FileUploadCancelingItem
  | FileUploadSuccessItem
  | FileUploadErrorItem
  | FileUploadCanceledItem;

export interface FileUploadSelectionBase {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

export type FileUploadSelection =
  | (FileUploadSelectionBase & {
      proposedItem: FileUploadSelectedItem;
      proposedAttemptId: string;
    })
  | (FileUploadSelectionBase & {
      proposedItem: Extract<FileUploadErrorItem, { error: { kind: 'validation' } }>;
      proposedAttemptId?: never;
    });

export interface FileUploadSelectIntent {
  selections: readonly FileUploadSelection[];
}

export interface FileUploadRetryIntent {
  id: string;
  previousAttemptId: string;
  proposedAttemptId: string;
}

export interface FileUploadCancelIntent {
  id: string;
  attemptId: string;
}

export interface FileUploadRemoveIntent {
  id: string;
}

export interface FileUploadMessages {
  label?: string;
  hint?: string;
  browse?: string;
  retry?: (name: string) => string;
  cancel?: (name: string) => string;
  remove?: (name: string) => string;
  selectionUnavailable?: string;
  validationAccept?: (name: string, accept: string) => string;
  validationMaxSize?: (name: string, maxSizeMB: number) => string;
  selected?: (name: string) => string;
  progress?: (name: string, percent: number) => string;
  progressIndeterminate?: (name: string) => string;
  canceling?: (name: string) => string;
  success?: (name: string) => string;
  error?: (name: string, message: string) => string;
  canceled?: (name: string) => string;
  removed?: (name: string) => string;
}

export interface FileUploadProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'children' | 'defaultValue' | 'onCancel' | 'onSelect'
> {
  items: readonly FileUploadItem[];
  onSelect: (intent: FileUploadSelectIntent) => void;
  onRetry: (intent: FileUploadRetryIntent) => void;
  onCancel: (intent: FileUploadCancelIntent) => void;
  onRemove: (intent: FileUploadRemoveIntent) => void;
  name?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  hint?: string;
  messages?: FileUploadMessages;
}
