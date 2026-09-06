import {
  createReactFixture,
  physicalPlacement,
  mergeHandlers,
} from '../../fixtures/wave2/react-fixture.mjs';
import { markerProps } from '../../fixtures/wave2/measurements.mjs';
const PACKAGE_NAME = '@radix-ui/react-tooltip';
async function importCandidateModule(specifier) {
  if (specifier === PACKAGE_NAME) return import('@radix-ui/react-tooltip');
  throw new Error('unexpected candidate package import');
}
export async function createTooltipCandidate({
  React,
  importModule = importCandidateModule,
  ...options
}) {
  const vendor = await importModule(PACKAGE_NAME);
  const h = React.createElement;
  const parts = vendor;
  function CandidateOwner({ model: m }) {
    const { owner, state } = m;
    const placement = physicalPlacement(state.placement, state.direction).split('-');
    const trigger = owner.triggerMounted
      ? h(parts.Trigger, { ...m.trigger.props }, m.trigger.children)
      : null;
    const contentProps = { ...m.content.props, 'data-overlay-portal': '' };
    const content = h(
      parts.Content,
      {
        ...contentProps,
        side: placement[0],
        align: placement[1] ?? 'center',
        sideOffset: 8,
        collisionPadding: 8,
      },
      m.content.children,
    );
    return h(
      parts.Root,
      { open: owner.open, onOpenChange: (next, details) => m.onOpenChange(next, details?.event) },
      trigger,
      h(parts.Portal, { container: m.portalContainer }, content),
    );
  }
  function Provider({ children }) {
    return h(parts.Provider, { delayDuration: 500, skipDelayDuration: 300 }, children);
  }
  const TooltipFixture = createReactFixture({
    React,
    ...options,
    family: 'tooltip',
    packageNames: [PACKAGE_NAME],
    CandidateOwner,
    Provider,
  });
  return Object.freeze({ TooltipFixture });
}
