export function isConfirmedRemovalFocusRecovery({ removedControl, expectedTarget, activeElement }) {
  return (
    !removedControl.isConnected &&
    expectedTarget.isConnected &&
    expectedTarget.disabled !== true &&
    activeElement === expectedTarget
  );
}
