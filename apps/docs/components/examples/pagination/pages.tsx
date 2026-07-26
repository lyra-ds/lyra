'use client';

import { Pagination } from '@lyra-ds/react';
import { useState } from 'react';

export function PaginationPages() {
  const [page, setPage] = useState(6);

  return <Pagination page={page} total={20} onChange={setPage} />;
}
