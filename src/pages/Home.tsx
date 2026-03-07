import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { pixivApi } from '@/services/api/pixiv';
import { IllustCard } from '@/components/image/IllustCard';

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
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {rankingData?.illusts.map((illust, index) => (
            <IllustCard key={illust.id} illust={illust} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
