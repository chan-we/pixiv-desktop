import { Download, X, Check, AlertCircle, Loader2, Trash2, Inbox } from 'lucide-react';
import { useDownloadStore, type DownloadTask } from '@/stores/downloadStore';

function TaskStatusIcon({ status }: { status: DownloadTask['status'] }) {
  switch (status) {
    case 'pending':
      return <Download className="w-3.5 h-3.5 text-gray-500" />;
    case 'downloading':
      return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    case 'done':
      return <Check className="w-3.5 h-3.5 text-green-400" />;
    case 'error':
      return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
  }
}

export function DownloadPanel() {
  const { tasks, panelOpen, togglePanel, clearCompleted, clearAll } = useDownloadStore();

  if (!panelOpen) return null;

  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const errorCount = tasks.filter((t) => t.status === 'error').length;
  const activeCount = tasks.filter((t) => t.status === 'downloading').length;
  const totalCount = tasks.length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={togglePanel} />

      <div className="fixed top-14 right-4 z-50 w-80 flex flex-col bg-gray-800 border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Downloads</span>
            {totalCount > 0 && (
              <span className="text-xs text-gray-400">
                {doneCount}/{totalCount}
                {activeCount > 0 && ' — downloading…'}
                {errorCount > 0 && ` · ${errorCount} failed`}
              </span>
            )}
          </div>
          <button onClick={togglePanel} className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Task list */}
        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 border-t border-gray-700 text-gray-500">
            <Inbox className="w-8 h-8 mb-2" />
            <p className="text-xs">No downloads yet</p>
          </div>
        ) : (
          <>
            <div className="max-h-72 overflow-y-auto border-t border-gray-700 divide-y divide-gray-700/50">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-700/30"
                >
                  <TaskStatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">{task.fileName}</p>
                    {task.totalPages > 1 && (
                      <p className="text-[10px] text-gray-500">
                        {task.illustTitle} · p{task.pageIndex + 1}
                      </p>
                    )}
                    {task.status === 'error' && (
                      <p className="text-[10px] text-red-400 truncate">{task.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-1 px-2 py-1.5 border-t border-gray-700 bg-gray-800">
              {doneCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-400 hover:text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Clear done
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-gray-400 hover:text-red-400 rounded hover:bg-gray-700 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear all
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
