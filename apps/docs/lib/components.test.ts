import { describe, expect, it } from 'vitest';
import alpineProps from '../../../tools/docgen/output/alpine-props.json';
import reactProps from '../../../tools/docgen/output/props.json';
import { components } from './components';
import { SIBLING, stackOrder } from './stacks';

const alpineSlugs = new Set((alpineProps as { slug: string }[]).map((entry) => entry.slug));
const reactNames = new Set((reactProps as { name: string }[]).map((entry) => entry.name));

describe('manifesto de componentes', () => {
  it('nunca declara html e alpine ao mesmo tempo', () => {
    for (const entry of components) {
      expect(
        entry.stacks.includes('html') && entry.stacks.includes('alpine'),
        `${entry.slug} declara as duas formas da mesma aba`,
      ).toBe(false);
    }
  });

  it('dá a todo componente uma forma de HTML canônico', () => {
    for (const entry of components) {
      expect(
        entry.stacks.includes('html') || entry.stacks.includes('alpine'),
        `${entry.slug} não documenta o HTML de ninguém`,
      ).toBe(true);
    }
  });

  it('declara pelo menos uma stack por componente', () => {
    for (const entry of components) {
      expect(entry.stacks.length, `${entry.slug} sem nenhuma stack`).toBeGreaterThan(0);
    }
  });

  it('só declara stacks do vocabulário canônico', () => {
    for (const entry of components) {
      for (const stack of entry.stacks) expect(stackOrder).toContain(stack);
    }
  });

  it('não declara React sem props geradas correspondentes', () => {
    for (const entry of components.filter((item) => item.stacks.includes('react'))) {
      expect(
        reactNames.has(entry.name),
        `${entry.name} declara react sem entrada em props.json`,
      ).toBe(true);
    }
  });

  it('não declara Alpine sem binding gerado correspondente', () => {
    for (const entry of components.filter((item) => item.stacks.includes('alpine'))) {
      expect(alpineSlugs.has(entry.slug), `${entry.slug} declara alpine sem binding gerado`).toBe(
        true,
      );
    }
  });

  it('não deixa binding gerado sem página que o declare', () => {
    const declared = new Set(
      components.filter((entry) => entry.stacks.includes('alpine')).map((entry) => entry.slug),
    );

    for (const slug of alpineSlugs) {
      expect(declared.has(slug), `binding ${slug} gerado mas nenhuma página o declara`).toBe(true);
    }
  });

  it('explica toda stack ausente', () => {
    for (const entry of components) {
      for (const stack of stackOrder) {
        if (entry.stacks.includes(stack)) continue;

        const sibling = SIBLING[stack];
        if (sibling && entry.stacks.includes(sibling)) continue;

        expect(
          entry.absence?.[stack],
          `${entry.slug} não explica a ausência de ${stack}`,
        ).toBeTruthy();
      }
    }
  });
});
