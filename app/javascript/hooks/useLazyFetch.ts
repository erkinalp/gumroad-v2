import React from "react";

import { assertResponseError, request } from "$app/utils/request";

import { showAlert } from "$app/components/server-components/Alert";

interface UseLazyFetchOptions<T> {
  url: string;
  responseParser: (data: any) => T;
  hasMore?: boolean;
}

interface UseLazyFetchResult<T> {
  data: T;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  setData: (data: T) => void;
  fetchData: (queryParams?: QueryParams) => Promise<void>;
  hasLoaded: boolean;
  setHasLoaded: (hasLoaded: boolean) => void;
}

type QueryParams = Record<string, string | number>;

export type Pagination = {
  count: number;
  from: number;
  in: number;
  last: number;
  limit: number;
  next: number | null;
  offset: number;
  outset: number;
  overflow: number;
  page: number;
  prev: number | null;
  to: number;
};

// Internal hook that handles the core fetching logic
const useLazyFetchCore = <T>(
  initialData: T,
  options: UseLazyFetchOptions<T>,
  shouldFetchCondition: (hasLoaded: boolean) => boolean,
  onSuccess?: (responseData: any, parsedData: T) => void,
) => {
  const [data, setData] = React.useState<T>(initialData);
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const fetchData = React.useCallback(
    async (queryParams: QueryParams = {}) => {
      if (!shouldFetchCondition(hasLoaded)) return;

      setIsLoading(true);

      try {
        const url = new URL(options.url, window.location.origin);
        Object.entries(queryParams).forEach(([key, value]) => {
          url.searchParams.set(key, value.toString());
        });

        const response = await request({
          method: "GET",
          accept: "json",
          url: url.pathname + url.search,
        });
        const responseData = await response.json();
        const parsedData = options.responseParser(responseData);

        setData(parsedData);
        setHasLoaded(true);

        onSuccess?.(responseData, parsedData);
      } catch (e) {
        assertResponseError(e);
        showAlert(e.message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [options.url, options.responseParser, hasLoaded, shouldFetchCondition],
  );

  return {
    data,
    setData,
    isLoading,
    setIsLoading,
    fetchData,
    hasLoaded,
    setHasLoaded,
  };
};

export const useLazyFetch = <T>(initialData: T, options: UseLazyFetchOptions<T>): UseLazyFetchResult<T> =>
  useLazyFetchCore(initialData, options, (hasLoaded) => !hasLoaded);

type UseLazyPaginatedFetchResult<T> = UseLazyFetchResult<T> & {
  hasMore: boolean;
  setHasMore: (hasMore: boolean) => void;
  pagination: Pagination;
};

interface UseLazyPaginatedFetchOptions<T> extends UseLazyFetchOptions<T> {
  mode?: "append" | "prepend" | "replace";
  perPage?: number;
}

export const useLazyPaginatedFetch = <T>(
  initialData: T,
  options: UseLazyPaginatedFetchOptions<T>,
): UseLazyPaginatedFetchResult<T> => {
  const [hasMore, setHasMore] = React.useState(false);
  const [pagination, setPagination] = React.useState<Pagination>({
    count: 0,
    from: 0,
    in: 0,
    last: 0,
    limit: 0,
    next: null,
    offset: 0,
    outset: 0,
    overflow: 0,
    page: 0,
    prev: null,
    to: 0,
  });
  const [currentData, setCurrentData] = React.useState<T>(initialData);

  const mode = options.mode || "replace";
  const perPage = options.perPage || 20;

  const core = useLazyFetchCore(
    initialData,
    options,
    (hasLoaded) => !hasLoaded || hasMore,
    (responseData, parsedData) => {
      const { pagination: paginationData } = responseData as unknown as { pagination: Pagination };
      setPagination(paginationData);

      const canFetchMore = !!paginationData && paginationData.next !== null;
      setHasMore(canFetchMore);

      const canAddData = Array.isArray(currentData) && Array.isArray(parsedData);

      // Handle data based on mode
      if (mode === "append" && canAddData) {
        setCurrentData([...currentData, ...parsedData] as T);
      } else if (mode === "prepend" && canAddData) {
        setCurrentData([...parsedData, ...currentData] as T);
      } else {
        // Replace mode or non-array data
        setCurrentData(parsedData);
      }
    },
  );

  const fetchData = (queryParams: QueryParams = {}): Promise<void> =>
    core.fetchData({ ...queryParams, per_page: perPage });

  return {
    ...core,
    data: currentData,
    setData: setCurrentData,
    hasMore,
    setHasMore,
    pagination,
    fetchData,
  };
};
