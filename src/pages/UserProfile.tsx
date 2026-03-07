import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Image as ImageIcon, BookOpen, ArrowLeft } from 'lucide-react';
import { pixivApi } from '@/services/api/pixiv';
import { proxyImageUrl } from '@/utils/image';
import { IllustCard } from '@/components/image/IllustCard';
import type { Illust } from '@/types';

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const userId = Number(id);
  const [tab, setTab] = useState<'illust' | 'manga'>('illust');

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['userDetail', userId],
    queryFn: () => pixivApi.getUserDetail(userId),
    enabled: !!userId,
  });

  const { data: illustsData, isLoading: illustsLoading } = useQuery({
    queryKey: ['userIllusts', userId, tab],
    queryFn: () => pixivApi.getUserIllusts(userId, tab),
    enabled: !!userId,
  });

  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['userBookmarks', userId],
    queryFn: () => pixivApi.getUserBookmarks(userId),
    enabled: !!userId,
  });

  if (detailLoading || !userDetail) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const { user, profile } = userDetail;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Profile header */}
      <div className="flex items-center gap-5 mb-8">
        <img
          src={proxyImageUrl(user.profile_image_urls.medium)}
          alt={user.name}
          className="w-20 h-20 rounded-full"
        />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{user.name}</h1>
          <p className="text-gray-400">@{user.account}</p>
          {profile && (
            <div className="flex gap-4 mt-2 text-sm text-gray-400">
              <span><strong className="text-white">{profile.total_illusts}</strong> Illusts</span>
              <span><strong className="text-white">{profile.total_manga}</strong> Manga</span>
              <span><strong className="text-white">{profile.total_follow_users}</strong> Following</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-6">
        <button
          onClick={() => setTab('illust')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'illust'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Illusts
        </button>
        <button
          onClick={() => setTab('manga')}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'manga'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Manga
        </button>
      </div>

      {/* Works grid */}
      <IllustGrid
        illusts={illustsData?.illusts ?? []}
        isLoading={illustsLoading}
      />

      {/* Bookmarks */}
      <h2 className="text-lg font-bold text-white mt-10 mb-4">Bookmarks</h2>
      <IllustGrid
        illusts={bookmarksData?.illusts ?? []}
        isLoading={bookmarksLoading}
      />
    </div>
  );
}

function IllustGrid({ illusts, isLoading }: { illusts: Illust[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (illusts.length === 0) {
    return <div className="text-center py-12 text-gray-500">No works yet</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {illusts.map((illust) => (
        <IllustCard key={illust.id} illust={illust} />
      ))}
    </div>
  );
}
