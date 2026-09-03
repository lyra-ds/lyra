import React from 'react';
import { renderToString } from 'react-dom/server';

import { createModalCandidate } from '../../candidates/modal/adapter.mjs';
import { validateModalFixtureRequest } from './protocol.mjs';

export async function renderModalFixture(request) {
  const errors = validateModalFixtureRequest(request);
  if (errors.length !== 0) throw new Error(`modal SSR request is invalid: ${errors.join('; ')}`);
  const { ModalFixture } = await createModalCandidate({ React });
  return renderToString(React.createElement(ModalFixture, { request }));
}
