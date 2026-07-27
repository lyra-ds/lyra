import { Badge } from '@lyra-ds/react';

export function BadgeTones() {
  return (
    <>
      <Badge>neutral</Badge>
      <Badge tone="accent">accent</Badge>
      <Badge tone="success">success</Badge>
      <Badge tone="warning">warning</Badge>
      <Badge tone="danger">danger</Badge>
      <Badge tone="info">info</Badge>
    </>
  );
}
