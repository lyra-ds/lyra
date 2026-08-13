import {
  components,
  DEFAULT_SUPPORT_GAPS,
  DOCUMENTED_SUPPORT_LEVEL,
  supportLevels,
  type SupportGapMetadata,
  type SupportLevel,
} from './components';
import type { DocStack } from './stacks';

export { supportLevels };
export type { SupportLevel };

export type SupportGap = SupportGapMetadata;

export type SupportEvidence = {
  statusKey: string;
  href: string;
  reevaluationOwnerKey: string;
};

export type SupportCell =
  | { level: Exclude<SupportLevel, 'unsupported'>; evidence: SupportEvidence }
  | { level: 'unsupported'; gap: SupportGap };
export type SupportMatrixRow = {
  slug: string;
  name: string;
  stacks: Record<DocStack, SupportCell>;
};

const CURRENT_EVIDENCE: SupportEvidence = {
  statusKey: 'supportEvidenceChromiumOnly',
  href: '#automated-browser-gate',
  reevaluationOwnerKey: 'supportOwnerQualityPerformance',
};

function unsupported(stack: DocStack, reasonKey?: string): SupportCell {
  return {
    level: 'unsupported',
    gap: {
      ...DEFAULT_SUPPORT_GAPS[stack],
      reasonKey: reasonKey ?? DEFAULT_SUPPORT_GAPS[stack].reasonKey,
    },
  };
}

function supportCell(
  stack: DocStack,
  documented: DocStack[],
  absence?: Partial<Record<DocStack, string>>,
): SupportCell {
  // A Blade artifact is a downstream release, not v1 contract evidence. Its published
  // compatibility remains Unsupported until a separate compatibility update records it.
  if (stack === 'blade' || !documented.includes(stack)) return unsupported(stack, absence?.[stack]);

  return { level: DOCUMENTED_SUPPORT_LEVEL[stack], evidence: CURRENT_EVIDENCE };
}

export function getSupportMatrixRows(): SupportMatrixRow[] {
  return components.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    stacks: {
      react: supportCell('react', entry.stacks, entry.absence),
      html: supportCell('html', entry.stacks, entry.absence),
      alpine: supportCell('alpine', entry.stacks, entry.absence),
      blade: supportCell('blade', entry.stacks, entry.absence),
    },
  }));
}
