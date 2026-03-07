import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePagerProps {
  total: number;
  current: number;
  onChange: (page: number) => void;
}

export function ImagePager({ total, current, onChange }: ImagePagerProps) {
  if (total <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-gray-900/90 py-2">
      <button
        onClick={() => onChange(Math.max(0, current - 1))}
        disabled={current === 0}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-white" />
      </button>

      <span className="text-white text-sm min-w-[60px] text-center">
        {current + 1} / {total}
      </span>

      <button
        onClick={() => onChange(Math.min(total - 1, current + 1))}
        disabled={current === total - 1}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
