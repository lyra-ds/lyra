import { Stepper } from '@lyra-ds/react';

export function StepperStart() {
  return <Stepper steps={['Shipping address', 'Delivery', 'Review']} active={0} />;
}
