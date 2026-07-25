import { Button, Card } from '@lyra-ds/react';

export function CardStructured() {
  return (
    <Card
      title="Production deployment"
      actions={
        <Button size="sm" variant="ghost">
          View logs
        </Button>
      }
      footer={<Button size="sm">Review deployment</Button>}
    >
      Version 2.4.0 is waiting for approval before it reaches production.
    </Card>
  );
}
