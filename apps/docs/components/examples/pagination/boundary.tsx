'use client';

import { Pagination } from '@lyra-ds/react';
import { useState } from 'react';

export function PaginationBoundary() {
  const [page, setPage] = useState(1);

  return <Pagination page={page} total={5} onChange={setPage} aria-label="Project pages" />;
}
