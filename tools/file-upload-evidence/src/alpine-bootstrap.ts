import { uploadItemsController } from './alpine-controller';

const DEFAULT_DELAY_MS = 5_000;
const MAX_DELAY_MS = 15_000;
const decimalInteger = /^(?:0|[1-9]\d*)$/u;

export type AlpineScheduler = (callback: () => void, milliseconds: number) => void;

export interface AlpineBootstrapOptions {
  readonly schedule?: AlpineScheduler;
  readonly search?: string;
}

const initializedRoots = new WeakMap<HTMLElement, Promise<void>>();
const registeredAlpineInstances = new WeakSet<object>();

function scheduleWithWindow(callback: () => void, milliseconds: number): void {
  window.setTimeout(callback, milliseconds);
}

export function parseAlpineDelay(search: string): number {
  const value = new URLSearchParams(search).get('alpineDelay');
  if (value === null || !decimalInteger.test(value)) return DEFAULT_DELAY_MS;

  const milliseconds = Number(value);
  return milliseconds <= MAX_DELAY_MS ? milliseconds : DEFAULT_DELAY_MS;
}

async function initializeAlpine(root: HTMLElement): Promise<void> {
  const [{ default: Alpine }, { default: lyra }] = await Promise.all([
    import('alpinejs'),
    import('@lyra-ds/alpine'),
  ]);

  if (!registeredAlpineInstances.has(Alpine)) {
    Alpine.plugin(lyra);
    Alpine.data('uploadItems', uploadItemsController);
    registeredAlpineInstances.add(Alpine);
  }

  Alpine.initTree(root);
}

export function bootstrapAlpine(
  root: HTMLElement,
  { schedule = scheduleWithWindow, search = window.location.search }: AlpineBootstrapOptions = {},
): Promise<void> {
  const existing = initializedRoots.get(root);
  if (existing !== undefined) return existing;

  let startInitialization: () => void = () => undefined;
  const initialization = new Promise<void>((resolve, reject) => {
    startInitialization = () => {
      initializeAlpine(root).then(resolve, reject);
    };
  });
  initializedRoots.set(root, initialization);
  schedule(startInitialization, parseAlpineDelay(search));
  return initialization;
}
