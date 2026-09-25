import { OtpInput } from '@lyra-ds/react';

export function OtpInputError() {
  return <OtpInput label="Verification code" error="That code has expired. Request a new one." />;
}
