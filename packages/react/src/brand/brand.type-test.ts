import type { ReactElement } from 'react';
import type { BrandProps } from './brand';

// @ts-expect-error A mark-only brand must have a translated accessible name.
const unnamedMarkOnlyBrand: BrandProps = { mark: '/mark.svg' };
void unnamedMarkOnlyBrand;

const namedMarkOnlyBrand: BrandProps = { mark: '/mark.svg', 'aria-label': 'Marca Lyra' };
void namedMarkOnlyBrand;

const wordmarkBrand: BrandProps = { mark: '/mark.svg', children: 'Lyra' };
void wordmarkBrand;

const wordmarkLink = null as unknown as ReactElement;
const slottedBrand: BrandProps = { mark: '/mark.svg', asChild: true, children: wordmarkLink };
void slottedBrand;

// @ts-expect-error Brand owns the destination unless its child does, never both.
const conflictingDestination: BrandProps = {
  mark: '/mark.svg',
  href: '/',
  asChild: true,
  children: wordmarkLink,
};
void conflictingDestination;
