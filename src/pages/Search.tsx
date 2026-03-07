import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SearchInput } from '@/components/search/SearchInput';
import { SearchResults } from '@/components/search/SearchResults';
import {
  SearchFilterDrawer,
  defaultFilters,
  type SearchFilters,
} from '@/components/search/SearchFilterDrawer';
import { pixivApi } from '@/services/api/pixiv';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({ ...defaultFilters });
  const [filterOpen, setFilterOpen] = useState(false);

  const debouncedKeyword = useDebouncedValue(keyword, 300);
  const debouncedFilters = useDebouncedValue(filters, 300);

  const hasActiveFilters =
    filters.searchTarget !== defaultFilters.searchTarget ||
    filters.sort !== defaultFilters.sort ||
    filters.r18 !== defaultFilters.r18;

  useEffect(() => {
    const q = searchParams.get('q') || '';
    if (q && q !== keyword) {
      setKeyword(q);
    }
  }, [searchParams]);

  const searchQueryKey = useMemo(
    () => ['search', debouncedKeyword, debouncedFilters] as const,
    [debouncedKeyword, debouncedFilters]
  );

  const { data, isLoading } = useQuery({
    queryKey: searchQueryKey,
    queryFn: ({ signal }) =>
      pixivApi.searchIllust(debouncedKeyword, {
        sort: debouncedFilters.sort,
        searchTarget: debouncedFilters.searchTarget,
        r18: debouncedFilters.r18 || undefined,
        signal,
      }),
    enabled: debouncedKeyword.length > 0,
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions', debouncedKeyword],
    queryFn: ({ signal }) => pixivApi.getSearchSuggestions(debouncedKeyword, signal),
    enabled: debouncedKeyword.length > 0,
  });

  const suggestions = suggestionsData?.candidates?.map(c => c.tag_name) || [];

  const handleSearch = useCallback((newKeyword: string) => {
    setKeyword(newKeyword);
    setSearchParams({ q: newKeyword });
  }, [setSearchParams]);

  return (
    <div className="p-4">
      <div className="mb-6">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          onSearch={handleSearch}
          suggestions={suggestions}
          placeholder="Search illusts..."
          hasActiveFilters={hasActiveFilters}
          onFilterClick={() => setFilterOpen(true)}
        />
      </div>

      {keyword && (
        <SearchResults
          illusts={data?.illusts || []}
          isLoading={isLoading}
          hasMore={!!data?.next_url}
          onLoadMore={() => {}}
        />
      )}

      <SearchFilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
