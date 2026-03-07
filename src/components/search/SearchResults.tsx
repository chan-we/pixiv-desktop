import { Link } from 'react-router-dom';
import type { Illust } from '@/types';
import { proxyImageUrl } from '@/utils/image';

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
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
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
 <Link
            key={illust.id}
            to={`/image/${illust.id}`}
            className="group block relative overflow-hidden rounded-lg aspect-square bg-gray-800"
          >
            <img
              src={proxyImageUrl(illust.image_urls.square_medium)}
              alt={illust.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium truncate">{illust.title}</p>
                <p className="text-gray-300 text-xs truncate">{illust.user.name}</p>
              </div>
            </div>
            {illust.page_count > 1 && (
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                {illust.page_count}P
              </div>
            )}
          </Link>
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
