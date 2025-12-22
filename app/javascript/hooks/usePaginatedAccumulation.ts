import { router } from "@inertiajs/react";
import React from "react";

import { Pagination } from "$app/data/installments";

/**
 * Hook for managing "Load More" accumulation pattern for paginated lists.
 *
 * - Accumulates items across pages for infinite scroll / load more patterns
 * - Resets to fresh data when on page 1 (initial load or after search)
 * - Deduplicates items by external_id when appending
 * - Provides handleLoadMore callback for loading next page
 *
 * @param items - Current page items from server
 * @param pagination - Pagination metadata from server
 * @param query - Current search query (used in reload params)
 */
export function usePaginatedAccumulation<T extends { external_id: string }>(
  items: T[],
  pagination: Pagination,
  query: string,
) {
  const [allItems, setAllItems] = React.useState(items);

  React.useEffect(() => {
    if (pagination.page === 1) {
      // Reset when on first page (initial load or search)
      setAllItems(items);
    } else {
      // Append new items for subsequent pages
      setAllItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.external_id));
        const newItems = items.filter((i) => !existingIds.has(i.external_id));
        return [...prev, ...newItems];
      });
    }
  }, [items, pagination.page]);

  const handleLoadMore = React.useCallback(() => {
    router.reload({ data: { page: pagination.next, query: query || undefined } });
  }, [pagination.next, query]);

  return { allItems, setAllItems, handleLoadMore };
}
