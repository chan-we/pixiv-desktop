import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Images, Heart } from 'lucide-react';
import { pixivApi } from '@/services/api/pixiv';
import { proxyImageUrl } from '@/utils/image';
import type { Illust } from '@/types';

interface IllustCardProps {
  illust: Illust;
  rank?: number;
}

export function IllustCard({ illust, rank }: IllustCardProps) {
  const [bookmarked, setBookmarked] = useState(illust.is_bookmarked);
  const [pending, setPending] = useState(false);

  const handleToggleBookmark = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (pending) return;

      const prev = bookmarked;
      setBookmarked(!prev);
      setPending(true);

      try {
        if (prev) {
          await pixivApi.deleteBookmark(illust.id);
        } else {
          await pixivApi.addBookmark(illust.id);
        }
      } catch {
        setBookmarked(prev);
      } finally {
        setPending(false);
      }
    },
    [illust.id, bookmarked, pending]
  );

  return (
    <Link
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
          {rank != null && (
            <span className="text-orange-400 font-bold mb-1 block">#{rank}</span>
          )}
          <p className="text-white text-sm font-medium truncate">{illust.title}</p>
          <p className="text-gray-300 text-xs truncate">{illust.user.name}</p>
        </div>
      </div>

      {illust.page_count > 1 && (
        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Images className="w-3 h-3" />
          {illust.page_count}
        </div>
      )}

      <button
        onClick={handleToggleBookmark}
        className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-all ${
          bookmarked
            ? 'text-red-500 bg-black/60'
            : 'text-white/70 bg-black/40 opacity-0 group-hover:opacity-100 hover:text-red-400'
        } ${pending ? 'opacity-50' : ''}`}
        title={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      >
        <Heart className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} />
      </button>
    </Link>
  );
}
