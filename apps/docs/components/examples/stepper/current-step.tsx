import { Stepper } from '@lyra-ds/react';

export function StepperCurrentStep() {
  return <Stepper steps={['Account', 'Invite teammates', 'Choose a plan']} active={1} />;
}
