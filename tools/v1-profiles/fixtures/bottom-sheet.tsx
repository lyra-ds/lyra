import { useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BottomSheet } from '@lyra-ds/react/bottom-sheet';
import '@lyra-ds/styles/styles.css';

function BottomSheetFixture(): ReactNode {
  const [open, setOpen] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const [committed, setCommitted] = useState('No changes committed');

  return (
    <main aria-labelledby="page-title">
      <h1 id="page-title">BottomSheet profile fixture</h1>
      <p>Production packed BottomSheet accessibility checks.</p>
      <button ref={opener} type="button" onClick={() => setOpen(true)}>
        Open preferences
      </button>
      <output aria-live="polite">{committed}</output>
      <BottomSheet
        open={open}
        returnFocusTo={() => opener.current}
        initialFocusTo={() => document.querySelector<HTMLButtonElement>('.lyra-bottomsheet__close')}
        onClose={() => setOpen(false)}
        title="Edit notification preferences"
        aria-describedby="bottom-sheet-description"
      >
        <p id="bottom-sheet-description">Choose how this workspace sends notifications.</p>
        <label htmlFor="notification-email">Notification email</label>
        <input id="notification-email" name="notification-email" defaultValue="team@example.com" />
        <label htmlFor="notification-sender">Notification sender</label>
        <input id="notification-sender" defaultValue="Team" />
        <button id="send-test-notification" type="button">
          Send test notification
        </button>
        <button type="button" disabled>
          Managed by your administrator
        </button>
        <footer>
          <button type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setCommitted('Preferences saved');
              setOpen(false);
            }}
          >
            Save changes
          </button>
        </footer>
      </BottomSheet>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<BottomSheetFixture />);
