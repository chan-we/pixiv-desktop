import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ImageViewer } from '@/components/image/ImageViewer';
import { ImagePager } from '@/components/image/ImagePager';
import { pixivApi } from '@/services/api/pixiv';
import { proxyImageUrl } from '@/utils/image';

export function ImageDetail() {
  const { id } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(0);

  const { data: illust, isLoading } = useQuery({
    queryKey: ['illust', id],
    queryFn: () => pixivApi.getIllustDetail(Number(id)),
    enabled: !!id,
  });

  if (isLoading || !illust) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const pages = illust.meta_pages.length > 0
    ? illust.meta_pages
    : [{ image_urls: { large: illust.meta_single_page.original_image_url || illust.image_urls.large } }];

  const currentImageUrl = pages[currentPage]?.image_urls.large || illust.image_urls.large;

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur-sm">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </Link>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-300 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <ImageViewer src={proxyImageUrl(currentImageUrl)} alt={illust.title} />
      </div>

      {/* Pager */}
      <ImagePager
        total={pages.length}
        current={currentPage}
        onChange={setCurrentPage}
      />

      {/* Info Panel */}
      <div className="bg-gray-900/90 backdrop-blur-sm p-4">
        <h1 className="text-white font-medium text-lg mb-2">{illust.title}</h1>
        <div className="flex items-center gap-3">
          <img
            src={proxyImageUrl(illust.user.profile_image_urls.medium)}
            alt={illust.user.name}
            className="w-8 h-8 rounded-full"
          />
          <span className="text-gray-300">{illust.user.name}</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {illust.tags.map((tag) => (
            <span
              key={tag.name}
              className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded"
            >
              {tag.translated_name || tag.name}
            </span>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-gray-400 text-sm">
          <span>👁 {illust.total_view.toLocaleString()}</span>
          <span>❤️ {illust.total_bookmarks.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
