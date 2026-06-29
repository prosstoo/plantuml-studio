import { useEffect, useMemo, useState } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { parseParticipants, isSequenceDiagram } from '../../lib/pumlParser'
import {
  formatMessage,
  formatRequestResponse,
  insertMessages,
  type ArrowType,
} from '../../lib/sourceMutator'

const ARROW_OPTIONS: { value: ArrowType; label: string }[] = [
  { value: '->', label: '-> синхр.' },
  { value: '-->', label: '--> ответ' },
  { value: '<--', label: '<-- назад' },
  { value: '<->', label: '<-> двуст.' },
]

export function LinkBuilder() {
  const activeFile = useProjectStore((s) => s.activeFile)
  const files = useProjectStore((s) => s.files)
  const replaceActiveFileContent = useProjectStore((s) => s.replaceActiveFileContent)

  const content = files.find((f) => f.path === activeFile)?.content ?? ''

  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [arrow, setArrow] = useState<ArrowType>('->')
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')

  const participants = useMemo(() => {
    if (!isSequenceDiagram(content)) return []
    return parseParticipants(content)
  }, [content])

  useEffect(() => {
    if (participants.length === 0) {
      setFrom('')
      setTo('')
      return
    }
    if (!from || !participants.some((p) => p.alias === from)) {
      setFrom(participants[0].alias)
    }
    if (!to || !participants.some((p) => p.alias === to)) {
      setTo(participants[Math.min(1, participants.length - 1)].alias)
    }
  }, [participants, from, to])

  const handleAddLink = () => {
    if (!from || !to) return
    const line = formatMessage(from, to, message, arrow)
    const updated = insertMessages(content, [line])
    replaceActiveFileContent(updated)
    setMessage('')
  }

  const handleAddRequestResponse = () => {
    if (!from || !to || !message) return
    const lines = formatRequestResponse(
      from,
      to,
      message,
      response || 'Ответ',
    )
    const updated = insertMessages(content, lines)
    replaceActiveFileContent(updated)
    setMessage('')
    setResponse('')
  }

  const selectParticipant = (alias: string, field: 'from' | 'to') => {
    if (field === 'from') setFrom(alias)
    else setTo(alias)
  }

  if (!isSequenceDiagram(content)) {
    return (
      <div className="p-3 text-xs text-[var(--text-secondary)]">
        Добавьте participant, actor или database в код — здесь появятся быстрые
        связи.
      </div>
    )
  }

  if (participants.length === 0) {
    return (
      <div className="p-3 text-xs text-[var(--text-secondary)]">
        Участники не найдены. Используйте формат:{' '}
        <code className="text-[var(--accent)]">participant "Имя" as ALIAS</code>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-2">
      <p className="mb-2 text-xs text-[var(--text-secondary)]">
        Участники из кода:
      </p>
      <div className="mb-3 flex flex-wrap gap-1">
        {participants.map((p) => (
          <button
            key={p.alias}
            type="button"
            className={`chip ${from === p.alias ? 'chip-active' : ''}`}
            title={`${p.label} (${p.kind})`}
            onClick={() => {
              if (!from || from === to) selectParticipant(p.alias, 'from')
              else selectParticipant(p.alias, 'to')
            }}
          >
            {p.alias}
          </button>
        ))}
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <label className="field-label">
          От
          <select
            className="input-field w-full"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            {participants.map((p) => (
              <option key={p.alias} value={p.alias}>
                {p.alias}
              </option>
            ))}
          </select>
        </label>
        <label className="field-label">
          К
          <select
            className="input-field w-full"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {participants.map((p) => (
              <option key={p.alias} value={p.alias}>
                {p.alias}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field-label mb-2">
        Тип стрелки
        <select
          className="input-field w-full"
          value={arrow}
          onChange={(e) => setArrow(e.target.value as ArrowType)}
        >
          {ARROW_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label mb-2">
        Текст сообщения
        <input
          type="text"
          className="input-field w-full"
          placeholder="Сохранение данных"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddLink()}
        />
      </label>

      <button type="button" className="btn-primary mb-2 w-full text-xs" onClick={handleAddLink}>
        + Добавить связь
      </button>

      <div className="my-2 border-t border-[var(--border)] pt-2">
        <label className="field-label mb-2">
          Ответ (для пары запрос/ответ)
          <input
            type="text"
            className="input-field w-full"
            placeholder="Результат"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-secondary w-full text-xs"
          onClick={handleAddRequestResponse}
          disabled={!message}
        >
          + Запрос и ответ
        </button>
      </div>
    </div>
  )
}
