import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import { SearchInput } from '@/components/search/SearchInput';
import { SearchResults } from '@/components/search/SearchResults';
import { pixivApi } from '@/services/api/pixiv';
import { addSearchHistory, getSearchHistory } from '@/utils/storage';

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [history] = useState(getSearchHistory);

  const { data, isLoading } = useQuery({
    queryKey: ['search', keyword],
    queryFn: () => pixivApi.searchIllust(keyword),
    enabled: keyword.length > 0,
  });

  const { data: suggestionsData } = useQuery({
    queryKey: ['suggestions', keyword],
    queryFn: () => pixivApi.getSearchSuggestions(keyword),
    enabled: keyword.length > 0,
  });

  const suggestions = suggestionsData?.candidates?.map(c => c.tag_name) || [];

  const handleSearch = useCallback((newKeyword: string) => {
    setSearchParams({ q: newKeyword });
    addSearchHistory(newKeyword);
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

      {!keyword && history.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Searches
          </h3>
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 10).map((item, index) => (
              <button
                key={index}
                onClick={() => handleSearch(item)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full text-sm transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
