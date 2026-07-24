import { Badge } from '@lyra-ds/react';

export function BadgeDot() {
  return (
    <>
      <Badge tone="success" dot>
        Operational
      </Badge>
      <Badge tone="warning" dot>
        Degraded
      </Badge>
      <Badge tone="danger" dot>
        Outage
      </Badge>
    </>
  );
}
