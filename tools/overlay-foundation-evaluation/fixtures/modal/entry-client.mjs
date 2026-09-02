import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import axe from 'axe-core';

import { createModalCandidate } from '../../candidates/modal/adapter.mjs';
import { mountModalFixtureClient } from './runtime.mjs';

const request = globalThis.__LYRA_MODAL_FIXTURE_REQUEST__;
globalThis.__LYRA_MODAL_FIXTURE__ = await mountModalFixtureClient({
  React,
  axe,
  createModalCandidate,
  createRoot,
  document,
  hydrateRoot,
  request,
});
