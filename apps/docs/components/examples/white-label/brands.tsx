import { Badge, Button, Card, Input } from '@lyra-ds/react';
import type { CSSProperties, ReactElement } from 'react';

type Brand = {
  id: string;
  name: string;
  tokens: CSSProperties & Record<`--${string}`, string>;
};

const brands: readonly Brand[] = [
  {
    id: 'harbor',
    name: 'Harbor',
    tokens: {
      '--brand': '#0D9488',
      '--brand-contrast': '#FFFFFF',
      '--brand-radius': '10px',
      '--brand-font': '"Plus Jakarta Sans", system-ui, sans-serif',
    },
  },
  {
    id: 'violet',
    name: 'Violet',
    tokens: {
      '--brand': '#7C3AED',
      '--brand-contrast': '#FFFFFF',
      '--brand-radius': '16px',
      '--brand-font': 'Georgia, serif',
    },
  },
  {
    id: 'sunrise',
    name: 'Sunrise',
    tokens: {
      '--brand': '#F59E0B',
      '--brand-contrast': '#1E293B',
      '--brand-radius': '4px',
      '--brand-font': 'ui-monospace, SFMono-Regular, Menlo, monospace',
    },
  },
];

export function WhiteLabelBrands(): ReactElement {
  return (
    <div className="lw-white-label">
      {brands.map((brand) => (
        <Card
          key={brand.id}
          className="lw-white-label__card"
          data-brand={brand.id}
          title={brand.name}
          footer={<Button full>Create workspace</Button>}
          style={brand.tokens}
        >
          <div className="lw-white-label__body">
            <Badge tone="accent">Accent soft</Badge>
            <Input aria-label={`${brand.name} workspace name`} placeholder="Workspace name" />
          </div>
        </Card>
      ))}
    </div>
  );
}
