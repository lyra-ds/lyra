export interface TooltipOwner {
  hasOwnership(): boolean;
  dismiss(): void;
}

const coordinators = new WeakMap<Document, TooltipCoordinator>();

/** Coordinates warm hover and Escape ownership for Tooltip instances in one document. */
export class TooltipCoordinator {
  private readonly owners = new Set<TooltipOwner>();
  private readonly visibleOwners: TooltipOwner[] = [];
  private warm = false;
  private warmTimer: number | undefined;
  private listening = false;
  private readonly dismissedEvents = new WeakSet<KeyboardEvent>();

  constructor(private readonly document: Document) {}

  register(owner: TooltipOwner): void {
    this.owners.add(owner);
  }

  unregister(owner: TooltipOwner): void {
    this.owners.delete(owner);
    this.removeVisible(owner);
    if (this.owners.size === 0) {
      this.reset();
      coordinators.delete(this.document);
      return;
    }
    this.updateWarmExpiry();
  }

  isWarm(): boolean {
    return this.warm;
  }

  opened(owner: TooltipOwner): void {
    this.cancelWarmExpiry();
    this.warm = true;
    this.removeVisible(owner);
    this.visibleOwners.push(owner);
    this.ensureListener();
  }

  closed(owner: TooltipOwner): void {
    this.removeVisible(owner);
    this.updateWarmExpiry();
  }

  ownershipChanged(): void {
    if (this.anyOwnership()) this.cancelWarmExpiry();
    else this.updateWarmExpiry();
  }

  dismissTop(event: KeyboardEvent): boolean {
    if (event.key !== 'Escape' || event.defaultPrevented || this.dismissedEvents.has(event)) {
      return false;
    }
    const owner = this.visibleOwners.at(-1);
    if (!owner) return false;
    this.dismissedEvents.add(event);
    event.preventDefault();
    owner.dismiss();
    return true;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.dismissTop(event);
  };

  private anyOwnership(): boolean {
    return [...this.owners].some((owner) => owner.hasOwnership());
  }

  private updateWarmExpiry(): void {
    if (this.visibleOwners.length > 0 || this.anyOwnership()) {
      this.cancelWarmExpiry();
      return;
    }
    if (!this.warm || this.warmTimer !== undefined) return;
    const window = this.document.defaultView;
    if (!window) return;
    this.warmTimer = window.setTimeout(() => {
      this.warmTimer = undefined;
      if (this.visibleOwners.length === 0 && !this.anyOwnership()) this.warm = false;
    }, 300);
  }

  private cancelWarmExpiry(): void {
    if (this.warmTimer === undefined) return;
    this.document.defaultView?.clearTimeout(this.warmTimer);
    this.warmTimer = undefined;
  }

  private ensureListener(): void {
    if (this.listening) return;
    this.document.addEventListener('keydown', this.onKeyDown);
    this.listening = true;
  }

  private removeVisible(owner: TooltipOwner): void {
    const index = this.visibleOwners.indexOf(owner);
    if (index !== -1) this.visibleOwners.splice(index, 1);
    if (this.visibleOwners.length === 0 && this.listening) {
      this.document.removeEventListener('keydown', this.onKeyDown);
      this.listening = false;
    }
  }

  private reset(): void {
    this.cancelWarmExpiry();
    this.warm = false;
    if (this.listening) this.document.removeEventListener('keydown', this.onKeyDown);
    this.listening = false;
    this.visibleOwners.length = 0;
  }
}

export function getTooltipCoordinator(document: Document): TooltipCoordinator {
  let coordinator = coordinators.get(document);
  if (!coordinator) {
    coordinator = new TooltipCoordinator(document);
    coordinators.set(document, coordinator);
  }
  return coordinator;
}
