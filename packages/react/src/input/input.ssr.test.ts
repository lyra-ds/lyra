// SSR test template (D-26) — runs in the "ssr" vitest project (environment: node).
// renderToString proves the pilot has no module-scope DOM access and survives server rendering,
// including the controlled/uncontrolled value binding and the error a11y wiring.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { Input } from './index';

describe('Input — SSR', () => {
  it('renderToString of a bare input returns a string with .lyra-input and NO .lyra-field', () => {
    const html = renderToString(createElement(Input, { 'aria-label': 'Bare' }));
    expect(typeof html).toBe('string');
    expect(html).toContain('class="lyra-input"');
    expect(html).not.toContain('lyra-field');
  });

  it('renderToString of a labeled+hint input emits the field chrome and a wired id', () => {
    const html = renderToString(createElement(Input, { label: 'Email', hint: 'Helper text' }));
    expect(html).toContain('lyra-field');
    expect(html).toContain('lyra-label');
    expect(html).toContain('lyra-hint');
    // label htmlFor and input id both present on the server output.
    const forId = /<label[^>]*for="([^"]+)"/.exec(html)?.[1];
    expect(forId).toBeTruthy();
    expect(html).toContain(`id="${forId}"`);
    expect(html).toContain('aria-describedby');
  });

  it('renderToString of an error input wires the error classes + aria (no throw)', () => {
    const html = renderToString(createElement(Input, { label: 'Email', error: 'Required' }));
    expect(html).toContain('lyra-input--error');
    expect(html).toContain('lyra-hint--error');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby');
    expect(html).toContain('Required');
  });

  it('renderToString of a controlled input renders the given value', () => {
    const html = renderToString(createElement(Input, { 'aria-label': 'Ctrl', value: 'preset' }));
    expect(html).toContain('value="preset"');
  });
});
