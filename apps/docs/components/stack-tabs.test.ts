import { describe, expect, it } from 'vitest';
import { readStoredStack, STACK_STORAGE_KEY } from './stack-tabs';

const storage = (value: string | null) => ({ getItem: () => value });

describe('readStoredStack', () => {
  it('prefere a query string ao valor guardado', () => {
    expect(readStoredStack(storage('react'), '?stack=blade')).toBe('blade');
  });

  it('usa o valor guardado quando não há query', () => {
    expect(readStoredStack(storage('alpine'), '')).toBe('alpine');
  });

  it('devolve null quando não há nem um nem outro', () => {
    expect(readStoredStack(storage(null), '')).toBeNull();
  });

  it('não valida o vocabulário — isso é trabalho de resolveStack', () => {
    expect(readStoredStack(storage(null), '?stack=perl')).toBe('perl');
  });

  it('usa uma chave de storage estável', () => {
    expect(STACK_STORAGE_KEY).toBe('lyra-docs-stack');
  });
});
