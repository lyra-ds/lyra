// Measurement only: these helpers never implement an overlay interaction policy.
export const markerProps = (target, part) => ({
  'data-overlay-id': target,
  'data-overlay-part': part,
});
export function targetElement(document, target) {
  if (target === 'document-body') return document?.body;
  const matches = [...(document?.querySelectorAll?.('[data-overlay-id]') ?? [])].filter(
    (node) => node.isConnected !== false && node.getAttribute('data-overlay-id') === target,
  );
  return matches.length === 1 ? matches[0] : undefined;
}
export function visible(element, scope) {
  if (!element || element.isConnected === false || element.hidden) return false;
  const style = scope.getComputedStyle?.(element);
  return (
    style?.display !== 'none' &&
    style?.visibility !== 'hidden' &&
    (typeof element.getClientRects !== 'function' || element.getClientRects().length > 0)
  );
}
export function rect(element) {
  const value = element?.getBoundingClientRect?.();
  return value
    ? {
        x: value.x,
        y: value.y,
        width: value.width,
        height: value.height,
        top: value.top,
        right: value.right,
        bottom: value.bottom,
        left: value.left,
      }
    : undefined;
}
export function placementFacts(popup, trigger, scope, direction) {
  const p = rect(popup),
    t = rect(trigger);
  if (!p || !t || !visible(popup, scope)) return {};
  const viewport = scope.visualViewport;
  const v = {
    left: viewport?.offsetLeft ?? 0,
    top: viewport?.offsetTop ?? 0,
    width: viewport?.width ?? scope.innerWidth,
    height: viewport?.height ?? scope.innerHeight,
  };
  const side =
    p.bottom <= t.top
      ? 'top'
      : p.top >= t.bottom
        ? 'bottom'
        : p.right <= t.left
          ? 'left'
          : p.left >= t.right
            ? 'right'
            : 'overlap';
  const vertical = side === 'top' || side === 'bottom';
  const close = (a, b) => Math.abs(a - b) < 2;
  const edge = vertical
    ? close(p.left, t.left)
      ? 'left'
      : close(p.right, t.right)
        ? 'right'
        : close(p.left + p.width / 2, t.left + t.width / 2)
          ? 'center'
          : 'shifted'
    : close(p.top + p.height / 2, t.top + t.height / 2)
      ? 'center'
      : close(p.top, t.top)
        ? 'top'
        : close(p.bottom, t.bottom)
          ? 'bottom'
          : 'shifted';
  const align =
    edge === 'center'
      ? 'center'
      : vertical
        ? edge === (direction === 'rtl' ? 'right' : 'left')
          ? 'start'
          : edge === (direction === 'rtl' ? 'left' : 'right')
            ? 'end'
            : 'shifted'
        : 'center';
  return {
    side,
    'physical-side': side,
    alignment: align,
    'alignment-edge': edge,
    'public-placement': popup.getAttribute?.('data-placement') ?? null,
    shifted: edge === 'shifted',
    'visual-viewport-contained':
      p.left >= v.left &&
      p.top >= v.top &&
      p.right <= v.left + v.width &&
      p.bottom <= v.top + v.height,
    'bounded-scroll-region':
      popup.scrollHeight > popup.clientHeight &&
      /auto|scroll/.test(scope.getComputedStyle?.(popup)?.overflowY ?? ''),
  };
}
// Install before candidate mounting. Only an actual disconnect releases ownership.
export function installMeasurementInstrumentation(scope, tracker) {
  const restores = [],
    observations = [],
    geometry = [],
    focusCalls = [];
  let reading = false;
  for (const name of ['ResizeObserver', 'MutationObserver', 'IntersectionObserver']) {
    const Original = scope[name];
    if (typeof Original !== 'function') continue;
    class MeasuredObserver extends Original {
      constructor(callback) {
        super((...args) => callback.apply(this, args));
        this.owned = new Map();
        observations.push(this);
      }
      observe(node, ...args) {
        const result = super.observe(node, ...args);
        if (!this.owned.has(node))
          this.owned.set(
            node,
            tracker?.acquireClaim?.({
              kind: 'observer',
              owner: node?.getAttribute?.('data-overlay-id') || 'unattributed',
            }),
          );
        return result;
      }
      unobserve(node) {
        const result = super.unobserve?.(node);
        this.owned.get(node)?.release();
        this.owned.delete(node);
        return result;
      }
      disconnect() {
        const result = super.disconnect();
        for (const claim of this.owned.values()) claim?.release();
        this.owned.clear();
        return result;
      }
    }
    if (typeof Original.prototype.unobserve !== 'function')
      delete MeasuredObserver.prototype.unobserve;
    scope[name] = MeasuredObserver;
    restores.push(() => {
      scope[name] = Original;
    });
  }
  const prototype = scope.Element?.prototype;
  const original = prototype?.getBoundingClientRect;
  if (original) {
    prototype.getBoundingClientRect = function (...args) {
      if (!reading)
        geometry.push({ target: this.getAttribute?.('data-overlay-id') ?? 'unattributed' });
      return original.apply(this, args);
    };
    restores.push(() => {
      prototype.getBoundingClientRect = original;
    });
  }
  const focusPrototype = scope.HTMLElement?.prototype;
  const originalFocus = focusPrototype?.focus;
  if (originalFocus) {
    focusPrototype.focus = function (...args) {
      focusCalls.push(this.getAttribute?.('data-overlay-id') ?? 'unobserved');
      return originalFocus.apply(this, args);
    };
    restores.push(() => {
      focusPrototype.focus = originalFocus;
    });
  }
  return {
    read(callback) {
      const before = reading;
      reading = true;
      try {
        return callback();
      } finally {
        reading = before;
      }
    },
    snapshot() {
      return {
        focusCalls: [...focusCalls],
        measurementCount: geometry.length,
        observerCount: observations.reduce((n, o) => n + o.owned.size, 0),
      };
    },
    restore() {
      for (const restore of restores.splice(0)) restore();
    },
  };
}

// First observed identity is fixed for the fixture lifetime; DOM IDs are never changed.
export function createIdentityMeasurements() {
  const targets = new Map();
  const claims = new Map();
  const unresolved = new Map();
  return {
    bind(target, raw) {
      if (!raw) return;
      const record = targets.get(target) ?? { target, first: raw };
      record.current = raw;
      targets.set(target, record);
      if (!claims.has(raw)) claims.set(raw, new Set());
      claims.get(raw).add(target);
    },
    normalize(raw, consumer = false) {
      if (!raw) return raw;
      const owners = claims.get(raw);
      if (owners?.size === 1) {
        const target = [...owners][0];
        if (targets.get(target).first === raw) return `${target}-id`;
      }
      if (!owners && consumer) return raw;
      if (!unresolved.has(raw)) unresolved.set(raw, `unresolved-id-${unresolved.size + 1}`);
      return unresolved.get(raw);
    },
    diagnostics() {
      return [...targets.values()].map((record) => ({ ...record }));
    },
  };
}
