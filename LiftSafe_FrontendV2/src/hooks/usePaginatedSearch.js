import { useMemo, useState } from 'react';

const DEFAULT_PAGE_SIZE = 10;

export function usePaginatedSearch(items = [], searchFields = [], pageSize = DEFAULT_PAGE_SIZE) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const term = search.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) => {
        const value = typeof field === 'function' ? field(item) : item[field];
        return String(value ?? '').toLowerCase().includes(term);
      })
    );
  }, [items, search, searchFields]);

  const paginated = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPage(0);
  };

  return {
    search,
    setSearch: handleSearchChange,
    page,
    setPage,
    pageSize,
    filtered,
    paginated,
    totalCount: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
  };
}
