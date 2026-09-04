import {
  createReactFixture,
  physicalPlacement,
  mergeHandlers,
} from '../../fixtures/wave2/react-fixture.mjs';
import { markerProps } from '../../fixtures/wave2/measurements.mjs';
const PACKAGE_NAME = '@lyra-ds/react/tooltip';
async function importCandidateModule(specifier) {
  if (specifier === PACKAGE_NAME) return import('@lyra-ds/react/tooltip');
  throw new Error('unexpected candidate package import');
}
export async function createTooltipCandidate({
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
      const content = root?.querySelector?.('[role="tooltip"]');
      if (content) {
        for (const [name, value] of Object.entries(markerProps(owner.id, 'content')))
          content.setAttribute(name, value);
        content.setAttribute('data-overlay-panel', '');
      }
    };
    const trigger = owner.triggerMounted ? h('button', m.trigger.props, m.trigger.children) : null;
    return h(
      vendor.Tooltip,
      {
        id: owner.id + '-root',
        tip: state.text,
        placement: physicalPlacement(state.placement, state.direction).split('-')[0],
        dir: state.direction,
      },
      trigger,
    );
  }
  const TooltipFixture = createReactFixture({
    React,
    ...options,
    family: 'tooltip',
    packageNames: [PACKAGE_NAME],
    CandidateOwner,
    readPrivate: ({ state, document }) =>
      Object.fromEntries(
        state.owners.map((owner) => [
          owner.id + ':open',
          document?.getElementById?.(owner.id + '-root')?.getAttribute('data-state') === 'open',
        ]),
      ),
  });
  return Object.freeze({ TooltipFixture });
}
