import { useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { Illust } from '@/types';
import { IllustCard } from '@/components/image/IllustCard';

interface SearchResultsProps {
  illusts: Illust[];
  isLoading?: boolean;
  isFetchingNextPage?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function SearchResults({
  illusts,
  isLoading,
  isFetchingNextPage,
  hasMore,
  onLoadMore,
}: SearchResultsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && !isFetchingNextPage) {
        onLoadMore?.();
      }
    },
    [hasMore, isFetchingNextPage, onLoadMore]
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '400px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect]);

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

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
