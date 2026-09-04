import {
  createReactFixture,
  physicalPlacement,
  mergeHandlers,
} from '../../fixtures/wave2/react-fixture.mjs';
import { markerProps } from '../../fixtures/wave2/measurements.mjs';
const PACKAGE_NAME = '@zag-js/menu';
async function importCandidateModule(specifier) {
  if (specifier === PACKAGE_NAME) return import('@zag-js/menu');
  if (specifier === '@zag-js/react') return import('@zag-js/react');
  throw new Error('unexpected candidate package import');
}
export async function createMenuCandidate({
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
      loopFocus: true,
      onSelect: (details) => m.select(details.value),
      'aria-label': 'Workspace',
    });
    const api = vendor.connect(service, normalizeProps);
    const trigger = owner.triggerMounted
      ? h('button', mergeHandlers(api.getTriggerProps(), m.trigger.props), m.trigger.children)
      : null;
    const items = m.items.map((item) =>
      item.type === 'separator'
        ? h('hr', {
            key: item.id,
            ...api.getSeparatorProps(),
            ...markerProps(item.id, 'separator'),
          })
        : item.type === 'label'
          ? h('span', { key: item.id, ...markerProps(item.id, 'label') }, item.label)
          : h(
              'div',
              {
                key: item.id,
                ...api.getItemProps({
                  value: item.id,
                  valueText: item.label,
                  disabled: item.disabled,
                }),
                ...markerProps(item.id, 'item'),
              },
              item.label,
            ),
    );
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
              ...items,
            ),
          ),
        )
      : null;
    return h(React.Fragment, null, trigger, content);
  }
  const MenuFixture = createReactFixture({
    React,
    ...options,
    family: 'menu',
    packageNames: [PACKAGE_NAME, '@zag-js/react'],
    CandidateOwner,
  });
  return Object.freeze({ MenuFixture });
}
