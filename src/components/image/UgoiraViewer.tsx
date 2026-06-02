import { useEffect, useState, useCallback, useRef } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { pixivApi } from '@/services/api/pixiv';
import { proxyImageUrl } from '@/utils/image';
import { getAuth } from '@/utils/storage';

interface UgoiraViewerProps {
  illustId: number;
  src: string; // poster image URL
  alt?: string;
}

interface GifResponse {
  path: string;
  data: string;
}

/**
 * Ugoira viewer for Pixiv animation format.
 *
 * Pixiv's ugoira images are ZIP files containing individual frames.
 * We use Rust backend to:
 * 1. Download the ZIP
 * 2. Extract frames
 * 3. Encode as GIF
 * 4. Return the GIF as base64
 */
export function UgoiraViewer({ illustId, src, alt = 'animation' }: UgoiraViewerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const animationRef = useRef<HTMLImageElement>(null);

  // Load and convert animation
  const loadAnimation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setProgress('Getting animation info...');

    try {
      // Get auth token
      const auth = getAuth();
      if (!auth?.accessToken) {
        throw new Error('Not authenticated');
      }

      // Fetch Ugoira metadata
      setProgress('Fetching metadata...');
      const metadata = await pixivApi.getUgoiraMetadata(illustId);
      const zipUrl = metadata.ugoira_metadata?.zip_urls?.medium;
      const frames = metadata.ugoira_metadata?.frames || [];

      if (!zipUrl) {
        throw new Error('No ZIP URL in metadata');
      }

      console.log('[UgoiraViewer] ZIP URL:', zipUrl);
      console.log('[UgoiraViewer] Frames:', frames.length);

      // Call Rust to convert (returns file path as string)
      setProgress('Converting animation...');
      const framesJson = JSON.stringify(frames);

      const gifFilePath = await invoke<string>('convert_ugoira', {
        illustId,
        zipUrl,
        framesJson,
        authToken: auth.accessToken,
      });

      console.log('[UgoiraViewer] GIF created at:', gifFilePath);

      // Get base64 data
      setProgress('Loading GIF...');
      console.log('[UgoiraViewer] Getting GIF from:', gifFilePath);
      const gifData = await invoke<GifResponse>('get_ugoira_gif', {
        gifPath: gifFilePath,
      });

      // Create data URL
      const dataUrl = `data:image/gif;base64,${gifData.data}`;
      setGifUrl(dataUrl);
      setProgress('Done!');
    } catch (err) {
      console.error('[UgoiraViewer] Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert animation');
    } finally {
      setIsLoading(false);
    }
  }, [illustId]);

  useEffect(() => {
    loadAnimation();
  }, [loadAnimation]);

  return (
    <div className="w-full h-full flex items-center justify-center relative">
      {gifUrl ? (
        <img
          ref={animationRef}
          src={gifUrl}
          alt={alt}
          className="max-w-full max-h-full object-contain"
        />
      ) : (
        <img
          src={proxyImageUrl(src)}
          alt={alt}
          className="max-w-full max-h-full object-contain"
        />
      )}

      {/* GIF badge */}
      <div className="absolute bottom-4 left-4 px-2 py-1 rounded bg-black/60 text-white text-xs flex items-center gap-1">
        <Film className="w-3 h-3" />
        GIF
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
          <span className="text-white text-sm">{progress}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute bottom-4 right-4 px-2 py-1 rounded bg-red-600 text-white text-xs">
          {error}
        </div>
      )}
    </div>
  );
}