import { useState, useCallback, useEffect } from 'react';
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

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({ ...defaultFilters });
  const [filterOpen, setFilterOpen] = useState(false);

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

  const { data, isLoading } = useQuery({
    queryKey: ['search', keyword, filters],
    queryFn: () =>
      pixivApi.searchIllust(keyword, {
        sort: filters.sort,
        searchTarget: filters.searchTarget,
        r18: filters.r18 || undefined,
      }),
    enabled: keyword.length > 0,
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions', keyword],
    queryFn: () => pixivApi.getSearchSuggestions(keyword),
    enabled: keyword.length > 0,
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
