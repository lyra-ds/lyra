import { Alert, Icon } from '@lyra-ds/react';

export function AlertTitleAndIcon() {
  return (
    <Alert
      tone="warning"
      title="Your trial ends in three days"
      icon={<Icon name="triangle-alert" size={18} />}
    >
      After that, projects stay readable but you cannot invite anyone new until a plan is chosen.
    </Alert>
  );
}
