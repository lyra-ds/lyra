import React from 'react';
import { renderToString } from 'react-dom/server';

import { createModalCandidate } from '../../candidates/modal/adapter.mjs';

export const request = __LYRA_MODAL_FIXTURE_REQUEST__;

export async function renderModalFixture() {
  const { ModalFixture } = await createModalCandidate({ React });
  return renderToString(React.createElement(ModalFixture, { request }));
}
