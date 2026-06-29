import { useState } from 'react'

interface CopyableErrorProps {
  title: string
  text: string
  hint?: string
}

export function CopyableError({ title, text, hint }: CopyableErrorProps) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-2xl rounded-lg border border-[var(--error)] bg-[var(--bg-secondary)] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[var(--error)]">{title}</p>
        <button type="button" className="preview-btn shrink-0" onClick={copy}>
          {copied ? 'Скопировано ✓' : 'Копировать'}
        </button>
      </div>
      {hint && (
        <p className="mb-2 text-xs text-[var(--text-secondary)]">{hint}</p>
      )}
      <pre className="copyable-error-text max-h-64 overflow-auto rounded border border-[var(--border)] bg-[var(--bg-primary)] p-3 text-xs leading-relaxed text-[var(--text-primary)]">
        {text}
      </pre>
    </div>
  )
}
