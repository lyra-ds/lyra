import {
  createReactFixture,
  physicalPlacement,
  mergeHandlers,
} from '../../fixtures/wave2/react-fixture.mjs';
import { markerProps } from '../../fixtures/wave2/measurements.mjs';
const PACKAGE_NAME = '@lyra-ds/react/popover';
async function importCandidateModule(specifier) {
  if (specifier === PACKAGE_NAME) return import('@lyra-ds/react/popover');
  throw new Error('unexpected candidate package import');
}
export async function createAnchoredCandidate({
  React,
  importModule = importCandidateModule,
  ...options
}) {
  const vendor = await importModule(PACKAGE_NAME);
  const h = React.createElement;
  function CandidateOwner({ model: m }) {
    const { owner, state } = m;
    owner.identify = (document) => {
      const root = document?.getElementById?.(owner.id + '-root');
      const content = root?.querySelector?.('[role="dialog"]');
      if (content) {
        for (const [name, value] of Object.entries(markerProps(owner.id, 'content')))
          content.setAttribute(name, value);
        content.setAttribute('data-overlay-panel', '');
      }
    };
    const trigger = owner.triggerMounted ? h('button', m.trigger.props, m.trigger.children) : null;
    const physical = physicalPlacement(state.placement, state.direction).split('-');
    return h(
      vendor.Popover,
      {
        id: owner.id + '-root',
        open: owner.open,
        onOpenChange: m.onOpenChange,
        trigger,
        side: ['top', 'bottom'].includes(physical[0]) ? physical[0] : undefined,
        align: physical[1] ?? 'center',
        width: state.geometry.contentWidth,
        ariaLabel: 'Workspace',
        dir: state.direction,
      },
      h('button', m.command.props, m.command.children),
      m.children,
      h(
        'span',
        {
          ...markerProps('last-content-element', 'content-end'),
          style: { display: 'block', marginTop: Math.max(0, state.geometry.contentHeight - 40) },
        },
        'Last content element',
      ),
    );
  }
  const AnchoredFixture = createReactFixture({
    React,
    ...options,
    family: 'anchored',
    packageNames: [PACKAGE_NAME],
    CandidateOwner,
  });
  return Object.freeze({ AnchoredFixture });
}
