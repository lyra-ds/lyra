import { Table } from '@lyra-ds/react';

const columns = [
  { key: 'channel', label: 'Channel' },
  { key: 'orders', label: 'Orders', align: 'right' as const },
  { key: 'revenue', label: 'Revenue', align: 'right' as const },
];

const rows = [
  { id: 'direct', channel: 'Direct', orders: '1,248', revenue: '$38,240' },
  { id: 'partner', channel: 'Partner', orders: '816', revenue: '$21,980' },
  { id: 'marketplace', channel: 'Marketplace', orders: '472', revenue: '$9,640' },
];

export function TableAlignment() {
  return <Table columns={columns} rows={rows} />;
}
