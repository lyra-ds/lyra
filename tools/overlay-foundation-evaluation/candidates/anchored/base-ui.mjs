import {
  createReactFixture,
  physicalPlacement,
  mergeHandlers,
} from '../../fixtures/wave2/react-fixture.mjs';
import { markerProps } from '../../fixtures/wave2/measurements.mjs';
const PACKAGE_NAME = '@base-ui-components/react/popover';
async function importCandidateModule(specifier) {
  if (specifier === PACKAGE_NAME) return import('@base-ui-components/react/popover');
  throw new Error('unexpected candidate package import');
}
export async function createAnchoredCandidate({
  React,
  importModule = importCandidateModule,
  ...options
}) {
  const vendor = await importModule(PACKAGE_NAME);
  const h = React.createElement;
  const parts = vendor.Popover;
  function CandidateOwner({ model: m }) {
    const { owner, state } = m;
    const placement = physicalPlacement(state.placement, state.direction).split('-');
    const trigger = owner.triggerMounted
      ? h(parts.Trigger, { ...m.trigger.props }, m.trigger.children)
      : null;
    const contentProps = {
      ...m.content.props,
      ...(m.successor ? { finalFocus: m.successor } : {}),
      'data-overlay-portal': '',
      'aria-label': 'Workspace',
    };
    const content = h(
      parts.Positioner,
      { side: placement[0], align: placement[1] ?? 'center', sideOffset: 8, collisionPadding: 8 },
      h(
        parts.Popup,
        contentProps,
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
      ),
    );
    return h(
      parts.Root,
      {
        open: owner.open,
        onOpenChange: (next, details) => m.onOpenChange(next, details?.event),
        modal: false,
      },
      trigger,
      h(parts.Portal, { container: m.portalContainer }, content),
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
