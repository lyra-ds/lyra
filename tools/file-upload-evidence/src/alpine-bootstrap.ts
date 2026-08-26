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
const alpineRuntimes = new WeakMap<HTMLElement, Promise<AlpineRuntime>>();
const authoredRootContents = new WeakMap<HTMLElement, readonly Node[]>();
const tornDownRoots = new WeakSet<HTMLElement>();
const registeredAlpineInstances = new WeakSet<object>();

type AlpineRuntime = Awaited<ReturnType<typeof importAlpineRuntime>>;

function scheduleWithWindow(callback: () => void, milliseconds: number): void {
  window.setTimeout(callback, milliseconds);
}

export function parseAlpineDelay(search: string): number {
  const value = new URLSearchParams(search).get('alpineDelay');
  if (value === null || !decimalInteger.test(value)) return DEFAULT_DELAY_MS;

  const milliseconds = Number(value);
  return milliseconds <= MAX_DELAY_MS ? milliseconds : DEFAULT_DELAY_MS;
}

async function importAlpineRuntime() {
  const [{ default: Alpine }, { default: lyra }] = await Promise.all([
    import('alpinejs'),
    import('@lyra-ds/alpine'),
  ]);
  if (!registeredAlpineInstances.has(Alpine)) {
    Alpine.plugin(lyra);
    Alpine.data('uploadItems', uploadItemsController);
    registeredAlpineInstances.add(Alpine);
  }
  return Alpine;
}

function alpineRuntimeFor(root: HTMLElement): Promise<AlpineRuntime> {
  const existing = alpineRuntimes.get(root);
  if (existing !== undefined) return existing;

  authoredRootContents.set(
    root,
    [...root.childNodes].map((node) => node.cloneNode(true)),
  );
  const runtime = importAlpineRuntime();
  alpineRuntimes.set(root, runtime);
  return runtime;
}

async function initializeAlpine(root: HTMLElement): Promise<void> {
  const Alpine = await alpineRuntimeFor(root);
  if (tornDownRoots.has(root)) {
    const authoredContents = authoredRootContents.get(root);
    if (authoredContents === undefined) {
      throw new Error('Missing authored Alpine fixture contents for reconnect.');
    }
    root.replaceChildren(...authoredContents.map((node) => node.cloneNode(true)));
    tornDownRoots.delete(root);
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

export async function teardownAlpineFixture(root: HTMLElement): Promise<void> {
  const Alpine = await alpineRuntimeFor(root);
  Alpine.destroyTree(root);
  initializedRoots.delete(root);
  tornDownRoots.add(root);
}

export async function reconnectAlpineFixture(root: HTMLElement): Promise<void> {
  await teardownAlpineFixture(root);
  await bootstrapAlpine(root, { schedule: (start) => start(), search: '?alpineDelay=0' });
}
