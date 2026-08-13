import bladeApi from '../../../tools/blade-api/api.json';
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

type BladeApiComponent = Pick<(typeof bladeApi.components)[number], 'binding' | 'slug'>;
type SupportMatrixOptions = {
  bladeComponents?: readonly BladeApiComponent[];
};

const CURRENT_EVIDENCE: SupportEvidence = {
  statusKey: 'supportEvidenceChromiumOnly',
  href: '#automated-browser-gate',
  reevaluationOwnerKey: 'supportOwnerQualityPerformance',
};

const BLADE_EVIDENCE: SupportEvidence = {
  statusKey: 'supportEvidenceBladeReleased',
  href: '#blade-timing',
  reevaluationOwnerKey: 'supportOwnerBladeMaintainers',
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
  stack: Exclude<DocStack, 'blade'>,
  documented: DocStack[],
  absence?: Partial<Record<DocStack, string>>,
): SupportCell {
  if (!documented.includes(stack)) return unsupported(stack, absence?.[stack]);

  return { level: DOCUMENTED_SUPPORT_LEVEL[stack], evidence: CURRENT_EVIDENCE };
}

function bladeSupportCell(
  slug: string,
  documented: DocStack[],
  bladeComponents: readonly BladeApiComponent[],
  absence?: Partial<Record<DocStack, string>>,
): SupportCell {
  if (!documented.includes('blade')) return unsupported('blade', absence?.blade);

  const releasedComponents = bladeComponents.filter((component) => component.slug === slug);
  if (releasedComponents.length !== 1) {
    throw new Error(
      `Released Blade API snapshot must contain exactly one component for ${slug}; found ${releasedComponents.length}.`,
    );
  }

  return {
    level: releasedComponents[0].binding === null ? 'css' : 'alpine-enhanced',
    evidence: BLADE_EVIDENCE,
  };
}

export function getSupportMatrixRows({
  bladeComponents = bladeApi.components,
}: SupportMatrixOptions = {}): SupportMatrixRow[] {
  return components.map((entry) => ({
    slug: entry.slug,
    name: entry.name,
    stacks: {
      react: supportCell('react', entry.stacks, entry.absence),
      html: supportCell('html', entry.stacks, entry.absence),
      alpine: supportCell('alpine', entry.stacks, entry.absence),
      blade: bladeSupportCell(entry.slug, entry.stacks, bladeComponents, entry.absence),
    },
  }));
}
