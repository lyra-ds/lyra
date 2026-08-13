import { components } from './components';
import { SIBLING, stackOrder, type DocStack } from './stacks';

export type SupportCell = { supported: boolean; reasonKey?: string };
export type SupportMatrixRow = {
  slug: string;
  name: string;
  stacks: Record<DocStack, SupportCell>;
};

export function getSupportMatrixRows(): SupportMatrixRow[] {
  return components.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    stacks: Object.fromEntries(
      stackOrder.map((stack) => {
        const sibling = SIBLING[stack];
        const supported =
          entry.stacks.includes(stack) || Boolean(sibling && entry.stacks.includes(sibling));
        return [stack, { supported, reasonKey: supported ? undefined : entry.absence?.[stack] }];
      }),
    ) as Record<DocStack, SupportCell>,
  }));
}
