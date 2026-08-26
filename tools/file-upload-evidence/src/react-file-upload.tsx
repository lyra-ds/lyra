import {
  FileUpload,
  type FileUploadItem,
  type FileUploadMessages,
  type FileUploadSelection,
} from '@lyra-ds/react/file-upload';
import {
  cloneElement,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { flushSync } from 'react-dom';
import type { Locale, UploadMode } from './contracts';
import { MESSAGES } from './messages';
import { uploadReducer, type UploadMachineAction } from './upload-machine';

const ENDPOINT = '/api/file-upload-evidence';
const CLIENT_HEADER = 'X-Lyra-Evidence-Client';
const MAX_DELAY_MS = 15_000;

export type EvidenceOperatorMode = UploadMode | 'indeterminate' | 'stale';

export interface ReactFileUploadEvidenceHandle {
  advanceIndeterminate(): void;
  deliverStale(): void;
  reset(): void;
}

export interface ReactFileUploadEvidenceDiagnostics {
  readonly itemId: string | null;
  readonly attemptId: string | null;
  readonly lifecycleState: FileUploadItem['status'] | 'idle';
  readonly focusTarget: string | null;
}

export interface ReactFileUploadEvidenceProps {
  ref?: Ref<ReactFileUploadEvidenceHandle>;
  locale: Locale;
  mode: EvidenceOperatorMode;
  xhrFactory?: () => XMLHttpRequest;
  delayMilliseconds?: number;
  name?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  hint?: string;
  messages?: FileUploadMessages;
  renderDiagnostics?: (diagnostics: ReactFileUploadEvidenceDiagnostics) => ReactNode;
}

type ResultAction = Extract<UploadMachineAction, { type: 'retryable-error' | 'succeeded' }>;

interface RetainedResult {
  readonly action: ResultAction;
  readonly id: string;
  readonly attemptId: string;
}

interface RequestRegistration {
  readonly request: XMLHttpRequest;
  readonly detach: () => void;
}

function createRequest(): XMLHttpRequest {
  return new XMLHttpRequest();
}

function acceptedSelection(
  selection: FileUploadSelection,
): selection is Extract<FileUploadSelection, { proposedAttemptId: string }> {
  return selection.proposedItem.status === 'selected';
}

function endpointMode(mode: EvidenceOperatorMode): UploadMode {
  if (mode === 'indeterminate') return 'delay';
  if (mode === 'stale') return 'error';
  return mode;
}

function boundedDelay(milliseconds: number): number {
  if (!Number.isFinite(milliseconds)) return 0;
  return Math.min(MAX_DELAY_MS, Math.max(0, Math.round(milliseconds)));
}

function responseError(request: XMLHttpRequest, locale: Locale): string {
  const response: unknown = request.response;
  if (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof response.error === 'string'
  ) {
    return response.error;
  }

  return MESSAGES[locale].endpoint.invalidRequest;
}

function describeFocusTarget(target: EventTarget): string | null {
  if (target instanceof HTMLInputElement && target.type === 'file') return `input:${target.name}`;
  if (target instanceof HTMLButtonElement) {
    const label = target.textContent?.trim();
    return label === undefined || label.length === 0 ? 'button' : `button:${label}`;
  }
  return target instanceof HTMLElement ? target.tagName.toLowerCase() : null;
}

export function ReactFileUploadEvidence({
  ref,
  locale,
  mode,
  xhrFactory = createRequest,
  delayMilliseconds = MAX_DELAY_MS,
  name = 'file',
  accept,
  maxSizeMB = 10,
  multiple,
  disabled,
  required,
  label,
  hint,
  messages,
  renderDiagnostics,
}: ReactFileUploadEvidenceProps) {
  const [items, dispatch] = useReducer(uploadReducer, [] as readonly FileUploadItem[]);
  const [focusTarget, setFocusTarget] = useState<string | null>(null);
  const files = useRef(new Map<string, File>());
  const requests = useRef(new Map<string, XMLHttpRequest>());
  const requestRegistrations = useRef(new Map<string, RequestRegistration>());
  const attempts = useRef(new Map<string, string>());
  const recordedProgress = useRef(new Map<string, UploadMachineAction>());
  const retainedResult = useRef<RetainedResult | null>(null);
  const fileUploadRoot = useRef<HTMLDivElement | null>(null);
  const currentItem = items.at(-1);
  const currentAttemptId =
    currentItem !== undefined && 'attemptId' in currentItem ? currentItem.attemptId : null;

  const diagnostics: ReactFileUploadEvidenceDiagnostics = {
    itemId: currentItem?.id ?? null,
    attemptId: currentAttemptId,
    lifecycleState: currentItem?.status ?? 'idle',
    focusTarget,
  };

  useEffect(() => {
    const activeRequests = requests.current;
    const activeRegistrations = requestRegistrations.current;
    const selectedFiles = files.current;
    const currentAttempts = attempts.current;
    const pendingProgress = recordedProgress.current;

    return () => {
      for (const [attemptId, request] of activeRequests) {
        const registration = activeRegistrations.get(attemptId);
        if (registration?.request === request) {
          registration.detach();
          activeRegistrations.delete(attemptId);
        }
        if (activeRequests.get(attemptId) === request) activeRequests.delete(attemptId);
        request.abort();
      }
      activeRegistrations.clear();
      selectedFiles.clear();
      currentAttempts.clear();
      pendingProgress.clear();
      retainedResult.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    const root = fileUploadRoot.current;
    root?.querySelector('input[type="file"]')?.setAttribute('data-evidence-id', 'react-file-input');
    root?.querySelector('.lyra-upload__list')?.setAttribute('data-evidence-id', 'react-file-list');
    root
      ?.querySelector('[aria-live="polite"]')
      ?.setAttribute('data-evidence-id', 'react-live-region');
  }, [items]);

  function startRequest(
    file: File,
    id: string,
    attemptId: string,
    startMode: EvidenceOperatorMode,
  ) {
    const request = xhrFactory();
    requests.current.set(attemptId, request);
    attempts.current.set(id, attemptId);

    const ownsRequest = () =>
      requests.current.get(attemptId) === request && attempts.current.get(id) === attemptId;
    const handleProgress = (event: ProgressEvent) => {
      if (!ownsRequest()) return;
      const action: UploadMachineAction = {
        type: 'native-progress',
        id,
        attemptId,
        lengthComputable: event.lengthComputable,
        loaded: event.loaded,
        total: event.total,
      };

      if (startMode === 'indeterminate') {
        recordedProgress.current.set(id, action);
        return;
      }
      dispatch(action);
    };
    const handleLoad = () => {
      if (!ownsRequest()) return;
      const action: ResultAction =
        request.status >= 200 && request.status < 300
          ? { type: 'succeeded', id, attemptId }
          : {
              type: 'retryable-error',
              id,
              attemptId,
              message: responseError(request, locale),
            };

      if (startMode === 'stale') {
        retainedResult.current = { action, id, attemptId };
      }
      dispatch(action);
    };
    const handleError = () => {
      if (!ownsRequest()) return;
      const action: ResultAction = {
        type: 'retryable-error',
        id,
        attemptId,
        message: MESSAGES[locale].endpoint.invalidRequest,
      };
      if (startMode === 'stale') {
        retainedResult.current = { action, id, attemptId };
      }
      dispatch(action);
    };
    const handleAbort = () => {
      if (!ownsRequest()) return;
      dispatch({ type: 'canceled', id, attemptId });
    };
    const handleLoadEnd = () => {
      if (requests.current.get(attemptId) !== request) return;
      const registration = requestRegistrations.current.get(attemptId);
      if (registration?.request === request) {
        registration.detach();
        requestRegistrations.current.delete(attemptId);
      }
      if (requests.current.get(attemptId) === request) requests.current.delete(attemptId);
    };
    const detach = () => {
      request.upload.removeEventListener('progress', handleProgress);
      request.removeEventListener('load', handleLoad);
      request.removeEventListener('error', handleError);
      request.removeEventListener('abort', handleAbort);
      request.removeEventListener('loadend', handleLoadEnd);
    };

    request.upload.addEventListener('progress', handleProgress);
    request.addEventListener('load', handleLoad);
    request.addEventListener('error', handleError);
    request.addEventListener('abort', handleAbort);
    request.addEventListener('loadend', handleLoadEnd);
    requestRegistrations.current.set(attemptId, { request, detach });

    const body = new FormData();
    body.set('file', file);
    body.set('locale', locale);
    const wireMode = endpointMode(startMode);
    body.set('mode', wireMode);
    if (wireMode === 'delay') {
      body.set('delay', String(boundedDelay(delayMilliseconds)));
    }

    request.open('POST', ENDPOINT);
    request.responseType = 'json';
    request.setRequestHeader(CLIENT_HEADER, 'xhr');
    request.send(body);
  }

  function advanceIndeterminate(): void {
    for (const action of recordedProgress.current.values()) dispatch(action);
    recordedProgress.current.clear();
  }

  function deliverStale(): void {
    const retained = retainedResult.current;
    if (retained === null || attempts.current.get(retained.id) === retained.attemptId) return;

    retainedResult.current = null;
    dispatch(retained.action);
  }

  function reset(): void {
    for (const [attemptId, request] of requests.current) {
      const registration = requestRegistrations.current.get(attemptId);
      if (registration?.request === request) {
        registration.detach();
        requestRegistrations.current.delete(attemptId);
      }
      if (requests.current.get(attemptId) === request) requests.current.delete(attemptId);
      request.abort();
    }
    requestRegistrations.current.clear();
    files.current.clear();
    attempts.current.clear();
    recordedProgress.current.clear();
    retainedResult.current = null;
    setFocusTarget(null);
    dispatch({ type: 'reset' });
  }

  useImperativeHandle(ref, () => ({ advanceIndeterminate, deliverStale, reset }));

  return (
    <>
      <FileUpload
        ref={fileUploadRoot}
        name={name}
        maxSizeMB={maxSizeMB}
        {...(accept === undefined ? {} : { accept })}
        {...(multiple === undefined ? {} : { multiple })}
        {...(disabled === undefined ? {} : { disabled })}
        {...(required === undefined ? {} : { required })}
        {...(label === undefined ? {} : { label })}
        {...(hint === undefined ? {} : { hint })}
        {...(messages === undefined ? {} : { messages })}
        items={items}
        onSelect={({ selections }) => {
          dispatch({
            type: 'selection',
            proposedItems: selections.map(({ proposedItem }) => proposedItem),
          });

          for (const selection of selections) {
            if (!acceptedSelection(selection)) continue;

            files.current.set(selection.id, selection.file);
            dispatch({
              type: 'upload-start',
              id: selection.id,
              attemptId: selection.proposedAttemptId,
            });
            startRequest(selection.file, selection.id, selection.proposedAttemptId, mode);
          }
        }}
        onRetry={({ id, previousAttemptId, proposedAttemptId }) => {
          const file = files.current.get(id);
          if (
            file === undefined ||
            attempts.current.get(id) !== previousAttemptId ||
            proposedAttemptId === previousAttemptId
          ) {
            return;
          }

          dispatch({ type: 'retry', id, previousAttemptId, proposedAttemptId });
          startRequest(file, id, proposedAttemptId, mode);
        }}
        onCancel={({ id, attemptId }) => {
          const request = requests.current.get(attemptId);
          if (request === undefined || attempts.current.get(id) !== attemptId) return;

          flushSync(() => {
            dispatch({ type: 'cancel-requested', id, attemptId });
          });
          request.abort();
        }}
        onRemove={({ id }) => {
          files.current.delete(id);
          attempts.current.delete(id);
          recordedProgress.current.delete(id);
          if (retainedResult.current?.id === id) retainedResult.current = null;
          dispatch({ type: 'removed', id });
        }}
        onFocusCapture={(event) => setFocusTarget(describeFocusTarget(event.target))}
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget;
          if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
            setFocusTarget(null);
          }
        }}
      />
      {(() => {
        const rendered = renderDiagnostics?.(diagnostics);
        return isValidElement<Record<string, unknown>>(rendered)
          ? cloneElement(rendered, { 'data-evidence-id': 'react-diagnostics' })
          : rendered;
      })()}
    </>
  );
}
