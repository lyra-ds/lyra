import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

import { createModalCandidate } from '../../candidates/modal/adapter.mjs';

const request = __LYRA_MODAL_FIXTURE_REQUEST__;
const { ModalFixture } = await createModalCandidate({ React });
const container = document.querySelector('[data-modal-fixture-root]');
if (!(container instanceof HTMLElement)) throw new Error('modal fixture root is missing');

const ready = Promise.withResolvers();
const element = React.createElement(ModalFixture, {
  request,
  onReady: (fixture) => ready.resolve(fixture),
});
if (container.hasChildNodes()) hydrateRoot(container, element);
else createRoot(container).render(element);

globalThis.__LYRA_MODAL_FIXTURE__ = Object.freeze({ ready: ready.promise, request });
