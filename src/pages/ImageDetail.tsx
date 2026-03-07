import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download, Loader2, Eye, Heart } from 'lucide-react';
import { save, open } from '@tauri-apps/plugin-dialog';
import { ImageViewer } from '@/components/image/ImageViewer';
import { ImagePager } from '@/components/image/ImagePager';
import { pixivApi } from '@/services/api/pixiv';
import { proxyImageUrl } from '@/utils/image';
import { useDownloadStore } from '@/stores/downloadStore';
import type { IllustDetail } from '@/types';

export function ImageDetail() {
  const { id } = useParams<{ id: string }>();
  const [currentPage, setCurrentPage] = useState(0);
  const queryClient = useQueryClient();

  const { data: illust, isLoading } = useQuery({
    queryKey: ['illust', id],
    queryFn: () => pixivApi.getIllustDetail(Number(id)),
    enabled: !!id,
  });

  const addTasks = useDownloadStore((s) => s.addTasks);

  const bookmarkMutation = useMutation({
    mutationFn: async (bookmarked: boolean) => {
      if (bookmarked) {
        await pixivApi.deleteBookmark(Number(id));
      } else {
        await pixivApi.addBookmark(Number(id));
      }
    },
    onMutate: async (bookmarked) => {
      await queryClient.cancelQueries({ queryKey: ['illust', id] });
      const previous = queryClient.getQueryData<IllustDetail>(['illust', id]);
      if (previous) {
        queryClient.setQueryData<IllustDetail>(['illust', id], {
          ...previous,
          is_bookmarked: !bookmarked,
          total_bookmarks: previous.total_bookmarks + (bookmarked ? -1 : 1),
        });
      }
      return { previous };
    },
    onError: (_err, _bookmarked, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['illust', id], context.previous);
      }
    },
  });

  const handleToggleBookmark = useCallback(() => {
    if (!illust || bookmarkMutation.isPending) return;
    bookmarkMutation.mutate(illust.is_bookmarked);
  }, [illust, bookmarkMutation]);

  const pages = illust
    ? illust.meta_pages.length > 0
      ? illust.meta_pages
      : [{ image_urls: { large: illust.meta_single_page.original_image_url || illust.image_urls.large, square_medium: illust.image_urls.square_medium } }]
    : [];

  const goToPrev = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentPage((p) => Math.min(pages.length - 1, p + 1));
  }, [pages.length]);

  const handleDownload = useCallback(async () => {
    if (!illust) return;

    const isMulti = pages.length > 1;

    if (isMulti) {
      const dir = await open({ directory: true, title: 'Choose download folder' });
      if (!dir) return;

      const tasks = pages.map((page, i) => {
        const url = page.image_urls.large || illust.image_urls.large;
        const ext = url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg';
        const fileName = `${illust.id}_p${i}.${ext}`;
        return {
          id: `${illust.id}-p${i}-${Date.now()}`,
          illustId: illust.id,
          illustTitle: illust.title,
          pageIndex: i,
          totalPages: pages.length,
          fileName,
          url,
          savePath: `${dir}/${fileName}`,
        };
      });
      addTasks(tasks);
    } else {
      const url = pages[0]?.image_urls.large || illust.image_urls.large;
      const ext = url.match(/\.(jpg|jpeg|png|gif|webp)/i)?.[1] || 'jpg';
      const fileName = `${illust.id}.${ext}`;

      const filePath = await save({
        defaultPath: fileName,
        filters: [{ name: 'Image', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] }],
      });
      if (!filePath) return;

      addTasks([{
        id: `${illust.id}-${Date.now()}`,
        illustId: illust.id,
        illustTitle: illust.title,
        pageIndex: 0,
        totalPages: 1,
        fileName,
        url,
        savePath: filePath,
      }]);
    }
  }, [illust, pages, addTasks]);

  useEffect(() => {
    setCurrentPage(0);
  }, [id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrev, goToNext]);

  if (isLoading || !illust) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const currentImageUrl = pages[currentPage]?.image_urls.large || illust.image_urls.large;
  const isMultiPage = pages.length > 1;

  return (
    <div className="h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 backdrop-blur-sm">
        <Link
          to="/"
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleBookmark}
            disabled={bookmarkMutation.isPending}
            className={`p-2 transition-colors ${
              illust.is_bookmarked
                ? 'text-red-500 hover:text-red-400'
                : 'text-gray-300 hover:text-red-400'
            } ${bookmarkMutation.isPending ? 'opacity-50' : ''}`}
            title={illust.is_bookmarked ? 'Remove bookmark' : 'Add bookmark'}
          >
            <Heart
              className="w-5 h-5"
              fill={illust.is_bookmarked ? 'currentColor' : 'none'}
            />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 text-gray-300 hover:text-white transition-colors"
            title={isMultiPage ? `Download all ${pages.length} images` : 'Download image'}
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image — key forces zoom reset on page change */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        <ImageViewer
          key={`${id}-${currentPage}`}
          src={proxyImageUrl(currentImageUrl)}
          alt={`${illust.title} - ${currentPage + 1}`}
        />

        {isMultiPage && (
          <>
            {currentPage > 0 && (
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {currentPage < pages.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors rotate-180"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {isMultiPage && (
        <div className="bg-gray-900/90 border-t border-gray-800 px-2 py-2">
          <div className="flex gap-1.5 overflow-x-auto justify-center">
            {pages.map((page, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`flex-shrink-0 w-14 h-14 rounded overflow-hidden border-2 transition-colors ${
                  i === currentPage ? 'border-blue-500' : 'border-transparent hover:border-gray-500'
                }`}
              >
                <img
                  src={proxyImageUrl(page.image_urls.square_medium || page.image_urls.large)}
                  alt={`Page ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom pager (keyboard hint) */}
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
            <Link
              key={tag.name}
              to={`/search?q=${encodeURIComponent(tag.name)}`}
              className="px-2 py-1 bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 text-xs rounded transition-colors cursor-pointer"
            >
              {tag.translated_name ? `${tag.name} / ${tag.translated_name}` : tag.name}
            </Link>
          ))}
        </div>
        <div className="flex gap-4 mt-3 text-gray-400 text-sm">
          <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {illust.total_view.toLocaleString()}</span>
          <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {illust.total_bookmarks.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
