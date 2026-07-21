// Extraction-rule regression fixture for tools/icon-registry/generate.mjs --self-test.
// Committed. Exercises one instance of every extraction category. The expected outcome
// is asserted in generate.mjs::runSelfTest():
//   resolvable set = { star, sun, moon, circle-alert, circle-check, heart, bell,
//                      folder, file, settings }
//   the `===` decoy operand "error" must NOT be extracted;
//   the Avatar dynamic-name site must produce neither an extraction nor a Pass-D error;
//   the someUnknownFn dynamic Icon site MUST be reported with its file:line.
import React from 'react';
import { Icon } from '../icons/Icon.jsx';

// Pass C — array rule (manifest source shape 1): arrayName = "iconNames".
const iconNames = ['heart', 'bell'];

// Pass C — resolver rule (manifest source shape 2/3): fnName = "pickIcon".
const pickIcon = (kind) => {
  if (kind === 'dir') return 'folder';
  return 'file';
};

// Pass C — dataprop rule (manifest source shape 4): propKey = "icon".
const nav = [{ id: 'prefs', label: 'Preferences', icon: 'settings' }];

export function Fixture({ on, status, user, someUnknownFn, x }) {
  return (
    <div>
      {/* Pass A — literal Icon prop. */}
      <Icon name="star" size={20} />

      {/* Pass B — ternary branch literals (sun/moon extracted). */}
      <Icon name={on ? 'sun' : 'moon'} size={18} />

      {/* Pass B — ternary with a `===` comparison-operand DECOY ("error" must NOT be
          extracted); circle-alert + circle-check ARE extracted. */}
      <Icon name={status === 'error' ? 'circle-alert' : 'circle-check'} size={17} />

      {/* Pass D — unresolvable dynamic Icon use: reported with file:line. */}
      <Icon name={someUnknownFn(x)} size={16} />

      {/* Icon-element scoping — a non-Icon component with a dynamic name prop is IGNORED
          by Passes B and D (no extraction, no Pass-D failure). */}
      <Avatar name={user.name} size="sm" />

      {/* The manifest sources (iconNames[], pickIcon(), nav[].icon) are declared above
          and consumed by Pass C directly — they need no Icon render site here, so this
          fixture keeps exactly ONE unresolvable Icon use (the someUnknownFn site). */}
      <span data-manifest={JSON.stringify({ iconNames, nav, sample: pickIcon('dir') })} />
    </div>
  );
}
