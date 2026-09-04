import {
  createReactFixture,
  physicalPlacement,
  mergeHandlers,
} from '../../fixtures/wave2/react-fixture.mjs';
import { markerProps } from '../../fixtures/wave2/measurements.mjs';
const PACKAGE_NAME = '@zag-js/popover';
async function importCandidateModule(specifier) {
  if (specifier === PACKAGE_NAME) return import('@zag-js/popover');
  if (specifier === '@zag-js/react') return import('@zag-js/react');
  throw new Error('unexpected candidate package import');
}
export async function createAnchoredCandidate({
  React,
  importModule = importCandidateModule,
  ...options
}) {
  const vendor = await importModule(PACKAGE_NAME);
  const h = React.createElement;
  const { useMachine, normalizeProps, Portal } = await importModule('@zag-js/react');
  function CandidateOwner({ model: m }) {
    const { owner, state } = m;
    const service = useMachine(vendor.machine, {
      id: owner.id + '-machine',
      ids: { trigger: m.trigger.props.id, content: owner.domId },
      open: owner.open,
      onOpenChange: (details) => m.onOpenChange(details.open),
      dir: state.direction,
      positioning: {
        placement: physicalPlacement(state.placement, state.direction),
        gutter: 8,
        overflowPadding: 8,
      },
      modal: false,
    });
    const api = vendor.connect(service, normalizeProps);
    const trigger = owner.triggerMounted
      ? h('button', mergeHandlers(api.getTriggerProps(), m.trigger.props), m.trigger.children)
      : null;
    const content = owner.open
      ? h(
          Portal,
          { container: m.portalContainer ? { current: m.portalContainer } : undefined },
          h(
            'div',
            api.getPositionerProps(),
            h(
              'div',
              {
                ...api.getContentProps(),
                ...m.content.props,
                'data-overlay-portal': '',
                'aria-label': 'Workspace',
              },
              h('button', m.command.props, m.command.children),
              m.children,
              h(
                'span',
                {
                  ...markerProps('last-content-element', 'content-end'),
                  style: {
                    display: 'block',
                    marginTop: Math.max(0, state.geometry.contentHeight - 40),
                  },
                },
                'Last content element',
              ),
            ),
          ),
        )
      : null;
    return h(React.Fragment, null, trigger, content);
  }
  const AnchoredFixture = createReactFixture({
    React,
    ...options,
    family: 'anchored',
    packageNames: [PACKAGE_NAME, '@zag-js/react'],
    CandidateOwner,
  });
  return Object.freeze({ AnchoredFixture });
}
