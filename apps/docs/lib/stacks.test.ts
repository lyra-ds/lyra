import { describe, expect, it } from 'vitest';
import { resolveStack, stackOrder } from './stacks';

describe('resolveStack', () => {
  it('honra a stack pedida quando ela existe para o componente', () => {
    expect(resolveStack(['react', 'alpine', 'blade'], 'blade')).toBe('blade');
  });

  it('cai na primeira disponível quando a pedida não existe ali', () => {
    expect(resolveStack(['react'], 'blade')).toBe('react');
  });

  it('cai na primeira disponível quando nada é pedido', () => {
    expect(resolveStack(['alpine', 'blade'], null)).toBe('alpine');
  });

  it('ignora valor arbitrário vindo da URL', () => {
    expect(resolveStack(['react', 'blade'], 'javascript')).toBe('react');
  });

  it('respeita a ordem canônica, não a ordem recebida', () => {
    expect(resolveStack(['blade', 'react'], null)).toBe('react');
  });

  it('expõe a ordem canônica das stacks', () => {
    expect(stackOrder).toEqual(['react', 'alpine', 'blade']);
  });
});
