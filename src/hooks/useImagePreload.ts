import { useEffect, useRef } from 'react';

/**
 * Two-phase image preloader:
 *  Phase 1 — immediately preload adjacent images (N-1, N+1, N+2)
 *  Phase 2 — once phase 1 completes, preload all remaining images
 *
 * Restarts from phase 1 whenever `currentIndex` changes.
 */
export function useImagePreload(
  urls: string[],
  currentIndex: number,
  ahead = 2,
) {
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    if (urls.length <= 1) return;

    let cancelled = false;
    const cache = cacheRef.current;

    const priorityIndices: number[] = [];
    for (let offset = 1; offset <= ahead; offset++) {
      const next = currentIndex + offset;
      if (next < urls.length) priorityIndices.push(next);
    }
    if (currentIndex - 1 >= 0) priorityIndices.push(currentIndex - 1);

    const restIndices = Array.from(urls.keys()).filter(
      (i) => i !== currentIndex && !priorityIndices.includes(i),
    );

    function loadBatch(indices: number[]): Promise<void> {
      const pending = indices
        .map((i) => urls[i])
        .filter((url) => !cache.has(url));

      if (pending.length === 0) return Promise.resolve();

      return new Promise<void>((resolve) => {
        let remaining = pending.length;
        const done = () => {
          remaining--;
          if (remaining <= 0) resolve();
        };

        for (const url of pending) {
          const img = new Image();
          img.onload = done;
          img.onerror = done;
          img.src = url;
          cache.set(url, img);
        }
      });
    }

    (async () => {
      await loadBatch(priorityIndices);
      if (cancelled) return;
      await loadBatch(restIndices);
    })();

    return () => {
      cancelled = true;
    };
  }, [urls, currentIndex, ahead]);
}
