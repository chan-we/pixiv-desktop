import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Images, Image as ImageIcon, BookOpen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { pixivApi } from '@/services/api/pixiv';
import { proxyImageUrl } from '@/utils/image';

export function Profile() {
  const { user: authUser } = useAuthStore();
  const [tab, setTab] = useState<'illust' | 'manga'>('illust');

  const { data: userDetail } = useQuery({
    queryKey: ['userDetail', authUser?.id],
    queryFn: () => pixivApi.getUserDetail(authUser!.id),
    enabled: !!authUser?.id,
  });

  const { data: illustsData, isLoading: illustsLoading } = useQuery({
    queryKey: ['userIllusts', authUser?.id, tab],
    queryFn: () => pixivApi.getUserIllusts(authUser!.id, tab),
    enabled: !!authUser?.id,
  });

  const { data: bookmarksData, isLoading: bookmarksLoading } = useQuery({
    queryKey: ['userBookmarks', authUser?.id],
    queryFn: () =>
      pixivApi.getUserBookmarks(authUser!.id),
    enabled: !!authUser?.id,
  });

  if (!authUser) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        Not logged in
      </div>
    );
  }

  const profile = userDetail?.profile;
  const user = userDetail?.user ?? authUser;

  return (
    <div className="max-w-4xl mx-auto p-4">
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

function IllustGrid({ illusts, isLoading }: { illusts: { id: number; title: string; image_urls: { square_medium: string }; user: { name: string }; page_count: number }[]; isLoading: boolean }) {
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
            <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              <Images className="w-3 h-3" />
              {illust.page_count}
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}
