interface ImagePagerProps {
  total: number;
  current: number;
  onChange: (page: number) => void;
}

export function ImagePager({ total, current, onChange }: ImagePagerProps) {
  if (total <= 1) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, current - 1))}
        disabled={current === 0}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span className="text-white text-sm min-w-[60px] text-center">
        {current + 1} / {total}
      </span>

      <button
        onClick={() => onChange(Math.min(total - 1, current + 1))}
        disabled={current === total - 1}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
