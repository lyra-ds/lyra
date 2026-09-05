import React from 'react';
import { renderToString } from 'react-dom/server';
import { validateWave2FixtureRequest } from './protocol.mjs';

const factories = {
  'OF-ANCHORED': ['createAnchoredCandidate', 'AnchoredFixture'],
  'OF-MENU': ['createMenuCandidate', 'MenuFixture'],
  'OF-TOOLTIP': ['createTooltipCandidate', 'TooltipFixture'],
};

export function createWave2ServerRenderer({
  React,
  renderToString,
  request,
  contractId,
  loadAdapter,
}) {
  const errors = validateWave2FixtureRequest(request);
  if (errors.length || !factories[contractId])
    throw new Error('invalid Wave2 server request: ' + errors.join('; '));
  return async function render({ renderTarget } = {}) {
    if (
      renderTarget !== undefined &&
      !request.scenario.operations.some(
        (op) =>
          op.operation === 'updateContent' &&
          op.target === renderTarget &&
          renderTarget.startsWith('server-render-'),
      )
    )
      throw new Error('server render target must be a declared execution control');
    // Safe typeof/existence checks are allowed. Successful rendering with actual
    // DOM globals absent establishes no observed dependency on a browser here.
    const requireServer = () => {
      for (const name of ['window', 'document', 'requestAnimationFrame', 'cancelAnimationFrame'])
        if (name in globalThis)
          throw new Error('server rendering requires absent DOM global: ' + name);
    };
    requireServer();
    const [factoryName, fixtureName] = factories[contractId];
    const adapter = await loadAdapter();
    const { [fixtureName]: Fixture } = await adapter[factoryName]({
      React,
      environment: Object.create(null),
    });
    const renderOnce = () =>
      renderToString(React.createElement(Fixture, { request, renderTarget }));
    const html = renderOnce();
    const repeatHtml = renderOnce();
    const facts = {
      'browser-globals:accessed': false,
      'server-render:deterministic': html === repeatHtml,
    };
    // Read the actual marked trigger attribute from React's escaped server output.
    const trigger = html.match(/<[^>]+\bdata-overlay-id="trigger"[^>]*>/u)?.[0];
    const expanded = trigger?.match(/\baria-expanded="([^"]*)"/u)?.[1];
    const target = renderTarget ?? request.scenario.operations[0]?.target ?? '';
    if (expanded === 'true' || expanded === 'false')
      facts[
        target.includes('open') ? 'trigger:open-aria-expanded' : 'trigger:closed-aria-expanded'
      ] = expanded === 'true';
    requireServer();
    return {
      html,
      repeatHtml,
      facts,
      requestJSON: JSON.stringify(request),
      contractId,
      renderTarget: target,
    };
  };
}

export async function renderWave2Fixture(options) {
  return createWave2ServerRenderer({
    React,
    renderToString,
    request: __LYRA_WAVE2_REQUEST__,
    contractId: __LYRA_WAVE2_CONTRACT__,
    loadAdapter: () => import('../../candidates/wave2/adapter.mjs'),
  })(options);
}
