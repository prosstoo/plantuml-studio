import { useState } from 'react'
import { useProjectStore } from '../../store/projectStore'

export function FileTree() {
  const files = useProjectStore((s) => s.files)
  const activeFile = useProjectStore((s) => s.activeFile)
  const setActiveFile = useProjectStore((s) => s.setActiveFile)
  const addFile = useProjectStore((s) => s.addFile)
  const removeFile = useProjectStore((s) => s.removeFile)

  const [newFileName, setNewFileName] = useState('')
  const [showNewFile, setShowNewFile] = useState(false)

  const handleAddFile = () => {
    const name = newFileName.trim()
    if (!name) return
    const path = name.endsWith('.puml') ? name : `${name}.puml`
    addFile(path)
    setNewFileName('')
    setShowNewFile(false)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Файлы
        </span>
        <button
          type="button"
          className="text-xs text-[var(--accent)] hover:underline"
          onClick={() => setShowNewFile(true)}
          title="Новый файл"
        >
          + файл
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {files.map((file) => (
          <div
            key={file.path}
            className={`group mb-0.5 flex cursor-pointer items-center rounded px-2 py-1.5 text-sm ${
              activeFile === file.path
                ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span className="mr-2 opacity-60">📄</span>
            <span className="flex-1 truncate" title={file.path}>
              {file.path.split('/').pop()}
            </span>
            {files.length > 1 && (
              <button
                type="button"
                className="ml-1 hidden rounded px-1 text-xs text-[var(--error)] group-hover:block hover:bg-[var(--error)]/10"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(file.path)
                }}
                title="Удалить"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {showNewFile && (
        <div className="border-t border-[var(--border)] p-2">
          <input
            type="text"
            className="input-field mb-2 w-full"
            placeholder="имя.puml"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddFile()
              if (e.key === 'Escape') setShowNewFile(false)
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <button type="button" className="btn-primary flex-1 text-xs" onClick={handleAddFile}>
              Создать
            </button>
            <button
              type="button"
              className="btn-secondary flex-1 text-xs"
              onClick={() => setShowNewFile(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
