import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
import { usersApi } from "@/lib/api/users";

interface UseUserMentionSearchOptions {
  limit?: number;
  enabled?: boolean;
  debounceMs?: number;
}

export function useUserMentionSearch(
  query: string,
  {
    limit = 5,
    enabled = true,
    debounceMs = 250,
  }: UseUserMentionSearchOptions = {}
) {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), debounceMs);
    return () => clearTimeout(t);
  }, [query, debounceMs]);

  const shouldSearch = enabled && debounced && debounced.trim().length >= 1;

  const { data, error, isLoading, mutate, isValidating } = useSWR(
    shouldSearch ? ["user-mention-search", debounced, limit] : null,
    ([, q, l]) => usersApi.search(q as string, l as number),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      keepPreviousData: true,
      dedupingInterval: 400,
    }
  );

  // 빈 배열 레퍼런스 안정화로 불필요한 리렌더 방지
  const users = useMemo(() => (data ? data : []), [data]);

  return {
    users,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}
