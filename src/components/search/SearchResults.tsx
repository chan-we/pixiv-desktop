import { Loader2 } from 'lucide-react';
import type { Illust } from '@/types';
import { IllustCard } from '@/components/image/IllustCard';

interface SearchResultsProps {
  illusts: Illust[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function SearchResults({ illusts, isLoading, hasMore, onLoadMore }: SearchResultsProps) {
  if (isLoading && illusts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (illusts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No results found
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {illusts.map((illust) => (
          <IllustCard key={illust.id} illust={illust} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
