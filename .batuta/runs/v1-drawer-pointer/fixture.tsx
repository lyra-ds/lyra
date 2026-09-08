import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Drawer } from '../../../packages/react/src/drawer/drawer';
import { Dialog } from '../../../packages/react/src/dialog/dialog';
import '../../../packages/styles/styles.css';
function Fixture() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const Component = new URLSearchParams(location.search).get('component') === 'drawer' ? Drawer : Dialog;
  return <><button onClick={() => setOpen(true)}>Open overlay</button><output aria-label="Close requests">{count}</output><Component open={open} title="Pointer proof" onClose={() => { setCount(c => c + 1); setOpen(false); }}><p>Editable work should survive a pointer gesture ending outside.</p><button>Inside action</button></Component></>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
