import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OtpInput } from './index';

describe('OtpInput SSR', () => {
  it('renders a labelled code group, six digits, and a form value without browser globals', () => {
    const html = renderToString(
      createElement(OtpInput, { label: 'Verification code', name: 'code', defaultValue: '123' }),
    );
    expect(html).toContain('role="group"');
    expect(html).toContain('autoComplete="one-time-code"');
    expect(html.match(/class="lyra-input lyra-otp__digit"/g)).toHaveLength(6);
    expect(html).toContain('name="code"');
    expect(html).toContain('value="123"');
  });
});
