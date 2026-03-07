import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { pixivApi } from '@/services/api/pixiv';
import { proxyImageUrl } from '@/utils/image';

type RankingMode = 'day' | 'week' | 'month' | 'day_male' | 'day_female' | 'week_original' | 'week_rookie';

const rankingModes: { value: RankingMode; label: string }[] = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'day_male', label: 'Male' },
  { value: 'day_female', label: 'Female' },
  { value: 'week_original', label: 'Original' },
  { value: 'week_rookie', label: 'Rookie' },
];

export function Home() {
  const [rankingMode, setRankingMode] = useState<RankingMode>('day');

  const { data: rankingData, isLoading } = useQuery({
    queryKey: ['ranking', rankingMode],
    queryFn: () => pixivApi.getIllustRanking(rankingMode),
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Ranking</h1>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {rankingModes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setRankingMode(mode.value)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              rankingMode === mode.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {rankingData?.illusts.map((illust, index) => (
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
                  <span className="text-orange-400 font-bold mb-1 block">#{index + 1}</span>
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
      )}
    </div>
  );
}
