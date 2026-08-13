import { describe, expect, it } from 'vitest';
import { components } from './components';
import { getSupportMatrixRows } from './support-matrix';

describe('public support matrix', () => {
  it('contains every documented component exactly once', () => {
    const rows = getSupportMatrixRows();
    expect(rows.map((row) => row.slug)).toHaveLength(components.length);
    expect(new Set(rows.map((row) => row.slug)).size).toBe(components.length);
  });

  it('preserves declared support and explains every unsupported stack', () => {
    for (const row of getSupportMatrixRows()) {
      for (const cell of Object.values(row.stacks)) {
        expect(cell.supported || cell.reasonKey).toBeTruthy();
      }
    }
  });
});
