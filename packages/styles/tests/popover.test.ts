import { afterEach, describe, expect, it } from 'vitest';
import { commands } from 'vitest/browser';
import '../styles.css';

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateFileUploadMedia(options: {
      forcedColors?: 'active' | 'none';
      reducedMotion?: 'reduce' | 'no-preference';
    }): Promise<void>;
  }
}

const popoverFixture = `
<main>
  <div class="lyra-popover-anchor">
    <div class="lyra-popover" data-testid="popover-panel">Popover content</div>
  </div>
</main>
`;

const popover = (): HTMLElement => {
  const element = document.querySelector<HTMLElement>('[data-testid="popover-panel"]');
  if (!element) throw new Error('Missing popover panel');
  return element;
};

describe('Popover reduced-motion entry animation', () => {
  afterEach(async () => {
    await commands.emulateFileUploadMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    document.body.innerHTML = '';
  });

  it('keeps the entry animation under no-preference and disables it when reduce is active', async () => {
    await commands.emulateFileUploadMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });
    document.body.innerHTML = popoverFixture;

    const panel = popover();
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
    expect(getComputedStyle(panel).animationName).toBe('lyra-popover-in');
    expect(Number.parseFloat(getComputedStyle(panel).animationDuration)).toBeGreaterThan(0);

    await commands.emulateFileUploadMedia({ reducedMotion: 'reduce' });
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    expect(getComputedStyle(panel).animationName).toBe('none');
    expect(getComputedStyle(panel).animationDuration).toBe('0s');
  });
});
