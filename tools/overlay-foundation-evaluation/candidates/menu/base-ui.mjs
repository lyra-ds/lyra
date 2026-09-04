import {
  createReactFixture,
  physicalPlacement,
  mergeHandlers,
} from '../../fixtures/wave2/react-fixture.mjs';
import { markerProps } from '../../fixtures/wave2/measurements.mjs';
const PACKAGE_NAME = '@base-ui-components/react/menu';
async function importCandidateModule(specifier) {
  if (specifier === PACKAGE_NAME) return import('@base-ui-components/react/menu');
  throw new Error('unexpected candidate package import');
}
export async function createMenuCandidate({
  React,
  importModule = importCandidateModule,
  ...options
}) {
  const vendor = await importModule(PACKAGE_NAME);
  const h = React.createElement;
  const parts = vendor.Menu;
  function CandidateOwner({ model: m }) {
    const { owner, state } = m;
    const placement = physicalPlacement(state.placement, state.direction).split('-');
    const trigger = owner.triggerMounted
      ? h(parts.Trigger, { ...m.trigger.props }, m.trigger.children)
      : null;
    const contentProps = {
      ...m.content.props,
      'data-overlay-portal': '',
      'aria-label': 'Workspace',
    };
    const items = m.items.map((item) =>
      item.type === 'separator'
        ? h(parts.Separator, { key: item.id, ...markerProps(item.id, 'separator') })
        : item.type === 'label'
          ? h('span', { key: item.id, ...markerProps(item.id, 'label') }, item.label)
          : h(
              parts.Item,
              {
                key: item.id,
                ...markerProps(item.id, 'item'),
                disabled: item.disabled,
                onClick: item.onSelect,
              },
              item.label,
            ),
    );
    const content = h(
      parts.Positioner,
      { side: placement[0], align: placement[1] ?? 'center', sideOffset: 8, collisionPadding: 8 },
      h(parts.Popup, contentProps, ...items),
    );
    return h(
      parts.Root,
      {
        open: owner.open,
        onOpenChange: (next, details) => m.onOpenChange(next, details?.event),
        modal: false,
        loopFocus: true,
      },
      trigger,
      h(parts.Portal, { container: m.portalContainer }, content),
    );
  }
  const MenuFixture = createReactFixture({
    React,
    ...options,
    family: 'menu',
    packageNames: [PACKAGE_NAME],
    CandidateOwner,
  });
  return Object.freeze({ MenuFixture });
}
