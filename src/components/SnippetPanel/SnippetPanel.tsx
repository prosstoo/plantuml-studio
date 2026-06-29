import { useState } from 'react'
import {
  SNIPPET_CATEGORIES,
  getSnippetsByCategory,
  type SnippetCategory,
} from '../../lib/snippets'
import { useProjectStore } from '../../store/projectStore'

export function SnippetPanel() {
  const [category, setCategory] = useState<SnippetCategory>('sequence')
  const requestInsert = useProjectStore((s) => s.requestInsert)

  const snippets = getSnippetsByCategory(category)

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--border)] px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          Сниппеты
        </span>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] p-2">
        {SNIPPET_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`rounded px-2 py-1 text-xs ${
              category === cat.id
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {snippets.map((snippet) => (
          <button
            key={snippet.id}
            type="button"
            className="snippet-btn"
            onClick={() => requestInsert(snippet.code)}
            title={snippet.code}
          >
            {snippet.label}
          </button>
        ))}
      </div>
    </div>
  )
}
