import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface SearchFilters {
  searchTarget: 'partial_match_for_tags' | 'exact_match_for_tags' | 'title_and_caption';
  sort: 'date_desc' | 'date_asc' | 'popular_desc';
  r18: '' | '-R-18' | 'R-18';
}

export const defaultFilters: SearchFilters = {
  searchTarget: 'partial_match_for_tags',
  sort: 'date_desc',
  r18: '',
};

const searchTargetOptions: { value: SearchFilters['searchTarget']; label: string }[] = [
  { value: 'partial_match_for_tags', label: '标签 部分匹配' },
  { value: 'exact_match_for_tags', label: '标签 完全匹配' },
  { value: 'title_and_caption', label: '标题/简介 匹配' },
];

const sortOptions: { value: SearchFilters['sort']; label: string }[] = [
  { value: 'date_desc', label: '最新作品' },
  { value: 'date_asc', label: '由旧到新' },
  { value: 'popular_desc', label: '热度排序' },
];

const r18Options: { value: SearchFilters['r18']; label: string }[] = [
  { value: '', label: '无限制' },
  { value: '-R-18', label: '全年龄' },
  { value: 'R-18', label: 'R-18' },
];

interface SearchFilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

function FilterSection<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-400 mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              value === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SearchFilterDrawer({
  open,
  onClose,
  filters,
  onFiltersChange,
}: SearchFilterDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleReset = () => {
    onFiltersChange({ ...defaultFilters });
  };

  const isDefault =
    filters.searchTarget === defaultFilters.searchTarget &&
    filters.sort === defaultFilters.sort &&
    filters.r18 === defaultFilters.r18;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 z-50 transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white">筛选条件</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100%-8rem)]">
          <FilterSection
            title="关键词匹配"
            options={searchTargetOptions}
            value={filters.searchTarget}
            onChange={(v) => onFiltersChange({ ...filters, searchTarget: v })}
          />
          <FilterSection
            title="排序方式"
            options={sortOptions}
            value={filters.sort}
            onChange={(v) => onFiltersChange({ ...filters, sort: v })}
          />
          <FilterSection
            title="R-18"
            options={r18Options}
            value={filters.r18}
            onChange={(v) => onFiltersChange({ ...filters, r18: v })}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 bg-gray-900">
          <button
            onClick={handleReset}
            disabled={isDefault}
            className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 rounded-lg text-sm transition-colors"
          >
            重置筛选
          </button>
        </div>
      </div>
    </>
  );
}
