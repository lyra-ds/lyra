import {
  createReactFixture,
  physicalPlacement,
  mergeHandlers,
} from '../../fixtures/wave2/react-fixture.mjs';
import { markerProps } from '../../fixtures/wave2/measurements.mjs';
const PACKAGE_NAME = '@lyra-ds/react/dropdown';
async function importCandidateModule(specifier) {
  if (specifier === PACKAGE_NAME) return import('@lyra-ds/react/dropdown');
  throw new Error('unexpected candidate package import');
}
export async function createMenuCandidate({
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
      const content = root?.querySelector?.('[role="menu"]');
      if (content) {
        for (const [name, value] of Object.entries(markerProps(owner.id, 'content')))
          content.setAttribute(name, value);
        content.setAttribute('data-overlay-panel', '');
      }
      for (const item of m.items) {
        const label = root?.querySelector?.('[data-overlay-label-for="' + item.id + '"]');
        const node = label?.closest?.('[role="menuitem"]') ?? label;
        if (node)
          for (const [name, value] of Object.entries(markerProps(item.id, item.type ?? 'item')))
            node.setAttribute(name, value);
      }
    };
    const trigger = owner.triggerMounted ? h('button', m.trigger.props, m.trigger.children) : null;
    const items = m.items.map((item) =>
      item.type === 'separator'
        ? { type: 'separator' }
        : item.type === 'label'
          ? { type: 'label', label: h('span', { 'data-overlay-label-for': item.id }, item.label) }
          : {
              id: item.id,
              label: h('span', { 'data-overlay-label-for': item.id }, item.label),
              onSelect: item.onSelect,
            },
    );
    // The current public item model cannot receive disabled or a cancelable event.
    return h(vendor.Dropdown, {
      id: owner.id + '-root',
      trigger,
      items,
      align: state.placement.endsWith('-end') ? 'end' : 'start',
      defaultOpen: owner.open,
      dir: state.direction,
    });
  }
  const MenuFixture = createReactFixture({
    React,
    ...options,
    family: 'menu',
    packageNames: [PACKAGE_NAME],
    CandidateOwner,
    limitations: ['successor-focus-target-unavailable'],
  });
  return Object.freeze({ MenuFixture });
}
