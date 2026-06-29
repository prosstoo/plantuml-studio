import { useMemo, useState } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { parseBoxes } from '../../lib/pumlParser'
import { updateBoxColor, insertBox, toColorInputValue } from '../../lib/sourceMutator'
import { DEFAULT_COLOR_PRESETS } from '../../lib/colorPresets'
import type { ColorPreset } from '../../lib/colorPresets'

export function ColorPanel() {
  const activeFile = useProjectStore((s) => s.activeFile)
  const files = useProjectStore((s) => s.files)
  const customColorPresets = useProjectStore((s) => s.customColorPresets)
  const replaceActiveFileContent = useProjectStore((s) => s.replaceActiveFileContent)
  const addCustomColorPreset = useProjectStore((s) => s.addCustomColorPreset)

  const content = files.find((f) => f.path === activeFile)?.content ?? ''
  const boxes = useMemo(() => parseBoxes(content), [content])

  const [newBoxName, setNewBoxName] = useState('')
  const [newBoxColor, setNewBoxColor] = useState('#E8EEF8')

  const allPresets = [...DEFAULT_COLOR_PRESETS, ...customColorPresets]

  const handleColorChange = (boxName: string, color: string) => {
    const latest =
      useProjectStore.getState().files.find((f) => f.path === activeFile)?.content ??
      content
    replaceActiveFileContent(updateBoxColor(latest, boxName, color))
  }

  const handleApplyPreset = (boxName: string, preset: ColorPreset) => {
    handleColorChange(boxName, preset.color)
  }

  const handleAddBox = () => {
    const name = newBoxName.trim()
    if (!name) return
    const preset = allPresets.find((p) => p.color === newBoxColor)
    const updated = insertBox(content, name, newBoxColor)
    replaceActiveFileContent(updated)
    if (preset && !customColorPresets.some((p) => p.id === preset.id)) {
      // preset already in defaults
    }
    setNewBoxName('')
  }

  const handleSavePreset = (color: string, name: string) => {
    addCustomColorPreset({
      id: `custom-${Date.now()}`,
      name,
      color,
      description: 'Пользовательский',
    })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-2">
      {boxes.length === 0 ? (
        <p className="mb-3 text-xs text-[var(--text-secondary)]">
          Области box не найдены. Добавьте{' '}
          <code className="text-[var(--accent)]">box "Название" #ЦВЕТ</code> в код
          или создайте новую область ниже.
        </p>
      ) : (
        <div className="mb-3 space-y-3">
          {boxes.map((box) => (
            <div
              key={`${box.name}-${box.line}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] p-2"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium" title={box.name}>
                  {box.name}
                </span>
                <input
                  type="color"
                  value={toColorInputValue(box.color)}
                  onChange={(e) => handleColorChange(box.name, e.target.value)}
                  className="h-7 w-10 cursor-pointer rounded border border-[var(--border)] bg-transparent"
                  title="Цвет области"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {allPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className="color-swatch"
                    style={{ backgroundColor: preset.color }}
                    title={`${preset.name} (${preset.color})`}
                    onClick={() => handleApplyPreset(box.name, preset)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-[var(--border)] pt-3">
        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
          Пресеты цветов
        </p>
        <div className="mb-3 grid grid-cols-2 gap-1">
          {allPresets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center gap-2 rounded border border-[var(--border)] px-2 py-1.5 text-xs"
            >
              <span
                className="h-4 w-4 shrink-0 rounded border border-[var(--border)]"
                style={{ backgroundColor: preset.color }}
              />
              <span className="truncate" title={preset.description}>
                {preset.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border)] pt-3">
        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
          + Новая область
        </p>
        <input
          type="text"
          className="input-field mb-2 w-full"
          placeholder='Название области'
          value={newBoxName}
          onChange={(e) => setNewBoxName(e.target.value)}
        />
        <div className="mb-2 flex items-center gap-2">
          <input
            type="color"
            value={newBoxColor}
            onChange={(e) => setNewBoxColor(e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-[var(--border)]"
          />
          <select
            className="input-field flex-1"
            value={newBoxColor}
            onChange={(e) => setNewBoxColor(e.target.value)}
          >
            {allPresets.map((p) => (
              <option key={p.id} value={p.color}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn-primary mb-2 w-full text-xs"
          onClick={handleAddBox}
          disabled={!newBoxName.trim()}
        >
          Добавить область
        </button>
        <button
          type="button"
          className="btn-secondary w-full text-xs"
          onClick={() =>
            newBoxName.trim() &&
            handleSavePreset(newBoxColor, newBoxName.trim())
          }
          disabled={!newBoxName.trim()}
        >
          Сохранить как пресет
        </button>
      </div>
    </div>
  )
}
