import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import axe from 'axe-core';

import { createModalCandidate } from '../../candidates/modal/adapter.mjs';
import { installModalResourceTracker, mountModalFixtureClient } from './runtime.mjs';

const request = globalThis.__LYRA_MODAL_FIXTURE_REQUEST__;
installModalResourceTracker(globalThis);
globalThis.__LYRA_MODAL_FIXTURE__ = await mountModalFixtureClient({
  React,
  axe,
  createModalCandidate,
  createRoot,
  document,
  hydrateRoot,
  request,
});
