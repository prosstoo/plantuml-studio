import { useEffect, useRef, useState } from 'react'
import { useProjectStore } from '../../store/projectStore'
import { downloadPng, downloadSvg } from '../../lib/exportImage'
import { normalizePath } from '../../lib/includeResolver'
import { DIAGRAM_STYLE_OPTIONS } from '../../lib/diagramThemes'
import type { DiagramStylePreset } from '../../lib/diagramThemes'

const LOGO_LIGHT = `${import.meta.env.BASE_URL}logo-light.svg`
const LOGO_DARK = `${import.meta.env.BASE_URL}logo-dark.svg`

interface ExampleManifest {
  id: string
  label: string
  files: { path: string; url: string }[]
}

const EXAMPLES: ExampleManifest[] = [
  {
    id: 'blank',
    label: 'Пустой шаблон',
    files: [{ path: 'main.puml', url: `${import.meta.env.BASE_URL}examples/blank.puml` }],
  },
  {
    id: 'sequence',
    label: 'Sequence — реестр заказов',
    files: [
      { path: '_common.puml', url: `${import.meta.env.BASE_URL}examples/_common.puml` },
      { path: 'sequence_phase.puml', url: `${import.meta.env.BASE_URL}examples/sequence_phase.puml` },
    ],
  },
  {
    id: 'phase03',
    label: 'Sequence — фаза 3 ССЗ',
    files: [
      { path: '_common.puml', url: `${import.meta.env.BASE_URL}examples/_common.puml` },
      { path: 'fm_phase03_ssz.puml', url: `${import.meta.env.BASE_URL}examples/fm_phase03_ssz.puml` },
    ],
  },
  {
    id: 'state',
    label: 'State — статусная схема',
    files: [{ path: 'state_diagram.puml', url: `${import.meta.env.BASE_URL}examples/state_diagram.puml` }],
  },
]

async function loadExampleFiles(
  example: ExampleManifest,
): Promise<{ path: string; content: string }[]> {
  const results = await Promise.all(
    example.files.map(async (f) => {
      const res = await fetch(f.url)
      const content = await res.text()
      return { path: normalizePath(f.path), content }
    }),
  )
  return results
}

async function readDroppedFiles(
  items: DataTransferItemList,
): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = []

  const traverse = async (entry: FileSystemEntry, basePath = ''): Promise<void> => {
    if (entry.isFile) {
      const fileEntry = entry as FileSystemFileEntry
      await new Promise<void>((resolve) => {
        fileEntry.file(async (file) => {
          if (file.name.endsWith('.puml') || file.name.endsWith('.plantuml')) {
            const content = await file.text()
            const path = basePath ? `${basePath}/${file.name}` : file.name
            files.push({ path: normalizePath(path), content })
          }
          resolve()
        })
      })
    } else if (entry.isDirectory) {
      const dirEntry = entry as FileSystemDirectoryEntry
      const reader = dirEntry.createReader()
      const dirPath = basePath ? `${basePath}/${entry.name}` : entry.name

      await new Promise<void>((resolve) => {
        const readEntries = () => {
          reader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve()
              return
            }
            await Promise.all(entries.map((e) => traverse(e, dirPath)))
            readEntries()
          })
        }
        readEntries()
      })
    }
  }

  const entries: FileSystemEntry[] = []
  for (let i = 0; i < items.length; i++) {
    const entry = items[i].webkitGetAsEntry?.()
    if (entry) entries.push(entry)
  }

  await Promise.all(entries.map((e) => traverse(e)))
  return files
}

export function Toolbar() {
  const theme = useProjectStore((s) => s.theme)
  const darkDiagram = useProjectStore((s) => s.darkDiagram)
  const diagramStylePreset = useProjectStore((s) => s.diagramStylePreset)
  const autoRender = useProjectStore((s) => s.autoRender)
  const activeFile = useProjectStore((s) => s.activeFile)
  const svg = useProjectStore((s) => s.svg)
  const toggleTheme = useProjectStore((s) => s.toggleTheme)
  const setDarkDiagram = useProjectStore((s) => s.setDarkDiagram)
  const setDiagramStylePreset = useProjectStore((s) => s.setDiagramStylePreset)
  const setAutoRender = useProjectStore((s) => s.setAutoRender)
  const loadProject = useProjectStore((s) => s.loadProject)
  const clearProject = useProjectStore((s) => s.clearProject)

  const folderInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const examplesRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)
  const [examplesOpen, setExamplesOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (examplesRef.current && !examplesRef.current.contains(e.target as Node)) {
        setExamplesOpen(false)
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return

    const files: { path: string; content: string }[] = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      if (!file.name.endsWith('.puml') && !file.name.endsWith('.plantuml')) continue
      const content = await file.text()
      const relativePath = file.webkitRelativePath || file.name
      files.push({ path: normalizePath(relativePath), content })
    }

    if (files.length > 0) loadProject(files)
    e.target.value = ''
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files
    if (!fileList) return

    const files: { path: string; content: string }[] = []
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      const content = await file.text()
      files.push({ path: normalizePath(file.name), content })
    }

    if (files.length > 0) loadProject(files)
    e.target.value = ''
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = await readDroppedFiles(e.dataTransfer.items)
    if (files.length > 0) loadProject(files)
  }

  const loadExample = async (example: ExampleManifest) => {
    const files = await loadExampleFiles(example)
    loadProject(files)
    setExamplesOpen(false)
  }

  const exportBaseName = activeFile.replace(/\.puml$/, '') || 'diagram'

  return (
    <header
      className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-4"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2">
        <img
          src={theme === 'dark' ? LOGO_DARK : LOGO_LIGHT}
          alt="PlantUML Studio"
          className="h-7 w-7"
        />
        <h1 className="text-sm font-semibold">PlantUML Studio</h1>
        <span className="text-[10px] text-[var(--text-secondary)]" title="Версия движка PlantUML">
          v{__PLANTUML_VERSION__}
        </span>
      </div>

      <div className="ml-4 flex items-center gap-2">
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => folderInputRef.current?.click()}
        >
          Открыть папку
        </button>
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          Открыть файлы
        </button>

        <div className="relative" ref={examplesRef}>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => {
              setExamplesOpen(!examplesOpen)
              setExportOpen(false)
            }}
          >
            Примеры ▾
          </button>
          {examplesOpen && (
            <div className="dropdown-menu">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  className="dropdown-item"
                  onClick={() => loadExample(ex)}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="button" className="btn-secondary text-xs" onClick={clearProject}>
          Новый
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <select
          className="input-field text-xs"
          value={diagramStylePreset}
          onChange={(e) =>
            setDiagramStylePreset(e.target.value as DiagramStylePreset)
          }
          title="Стиль диаграммы"
        >
          {DIAGRAM_STYLE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={autoRender}
            onChange={(e) => setAutoRender(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Авто
        </label>

        <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={darkDiagram}
            onChange={(e) => setDarkDiagram(e.target.checked)}
            className="accent-[var(--accent)]"
          />
          Тёмная диаграмма
        </label>

        <div className="relative" ref={exportRef}>
          <button
            type="button"
            className="btn-primary text-xs"
            disabled={!svg}
            onClick={() => {
              setExportOpen(!exportOpen)
              setExamplesOpen(false)
            }}
          >
            Экспорт ▾
          </button>
          {exportOpen && svg && (
            <div className="dropdown-menu right-0">
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  downloadSvg(svg, `${exportBaseName}.svg`)
                  setExportOpen(false)
                }}
              >
                Скачать SVG
              </button>
              <button
                type="button"
                className="dropdown-item"
                onClick={async () => {
                  await downloadPng(svg, `${exportBaseName}.png`, {
                    scale: 2,
                    background: theme === 'dark' ? '#1a2332' : '#ffffff',
                  })
                  setExportOpen(false)
                }}
              >
                Скачать PNG
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn-secondary px-2 text-xs"
          onClick={toggleTheme}
          title="Переключить тему"
        >
          {theme === 'dark' ? '☀' : '🌙'}
        </button>
      </div>

      <input
        ref={folderInputRef}
        type="file"
        className="hidden"
        // @ts-expect-error webkitdirectory is non-standard
        webkitdirectory=""
        multiple
        accept=".puml,.plantuml"
        onChange={handleFolderSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".puml,.plantuml"
        onChange={handleFileSelect}
      />
    </header>
  )
}
