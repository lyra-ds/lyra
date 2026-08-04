import { CheckboxGroup } from '@lyra-ds/react';

export function CheckboxGroupBasic() {
  return (
    <CheckboxGroup
      label="Notification channels"
      hint="Choose every channel you want to use."
      defaultValue={['email']}
      options={[
        { value: 'email', label: 'Email', hint: 'Release notes and account updates' },
        { value: 'push', label: 'Push notifications' },
        { value: 'sms', label: 'Text messages' },
      ]}
    />
  );
}
