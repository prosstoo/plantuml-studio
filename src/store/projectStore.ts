import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { normalizePath } from '../lib/includeResolver'

export interface ProjectFile {
  path: string
  content: string
}

export type Theme = 'dark' | 'light'
export type RenderStatus = 'idle' | 'loading' | 'success' | 'error'

const DEFAULT_MAIN = `main.puml`

const DEFAULT_CONTENT = `@startuml
title Пример диаграммы

Alice -> Bob: Привет!
Bob --> Alice: Привет!

@enduml`

interface ProjectState {
  files: ProjectFile[]
  activeFile: string
  theme: Theme
  darkDiagram: boolean
  svg: string | null
  renderStatus: RenderStatus
  renderError: string | null
  renderTimeMs: number | null
  debounceMs: number

  setActiveFile: (path: string) => void
  updateFileContent: (path: string, content: string) => void
  addFile: (path: string, content?: string) => void
  removeFile: (path: string) => void
  renameFile: (oldPath: string, newPath: string) => void
  loadProject: (files: ProjectFile[]) => void
  clearProject: () => void
  toggleTheme: () => void
  setDarkDiagram: (dark: boolean) => void
  setSvg: (svg: string | null) => void
  setRenderStatus: (status: RenderStatus, error?: string | null, timeMs?: number | null) => void
  getActiveContent: () => string
  getFilesMap: () => Map<string, string>
  insertAtCursor: (code: string) => void
  pendingInsert: string | null
  clearPendingInsert: () => void
  requestInsert: (code: string) => void
}

function createDefaultFiles(): ProjectFile[] {
  return [{ path: DEFAULT_MAIN, content: DEFAULT_CONTENT }]
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      files: createDefaultFiles(),
      activeFile: DEFAULT_MAIN,
      theme: 'dark',
      darkDiagram: false,
      svg: null,
      renderStatus: 'idle',
      renderError: null,
      renderTimeMs: null,
      debounceMs: 500,
      pendingInsert: null,

      setActiveFile: (path) => set({ activeFile: normalizePath(path) }),

      updateFileContent: (path, content) =>
        set((state) => ({
          files: state.files.map((f) =>
            f.path === normalizePath(path) ? { ...f, content } : f,
          ),
        })),

      addFile: (path, content = '@startuml\n\n@enduml') => {
        const normalized = normalizePath(path)
        const { files } = get()
        if (files.some((f) => f.path === normalized)) return
        set({
          files: [...files, { path: normalized, content }],
          activeFile: normalized,
        })
      },

      removeFile: (path) => {
        const normalized = normalizePath(path)
        const { files, activeFile } = get()
        if (files.length <= 1) return
        const newFiles = files.filter((f) => f.path !== normalized)
        set({
          files: newFiles,
          activeFile:
            activeFile === normalized ? newFiles[0].path : activeFile,
        })
      },

      renameFile: (oldPath, newPath) => {
        const oldNorm = normalizePath(oldPath)
        const newNorm = normalizePath(newPath)
        const { files, activeFile } = get()
        if (files.some((f) => f.path === newNorm && f.path !== oldNorm)) return
        set({
          files: files.map((f) =>
            f.path === oldNorm ? { ...f, path: newNorm } : f,
          ),
          activeFile: activeFile === oldNorm ? newNorm : activeFile,
        })
      },

      loadProject: (files) => {
        if (files.length === 0) return
        set({
          files: files.map((f) => ({
            path: normalizePath(f.path),
            content: f.content,
          })),
          activeFile: normalizePath(files[0].path),
          svg: null,
          renderStatus: 'idle',
          renderError: null,
        })
      },

      clearProject: () =>
        set({
          files: createDefaultFiles(),
          activeFile: DEFAULT_MAIN,
          svg: null,
          renderStatus: 'idle',
          renderError: null,
        }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),

      setDarkDiagram: (dark) => set({ darkDiagram: dark }),

      setSvg: (svg) => set({ svg }),

      setRenderStatus: (status, error = null, timeMs = null) =>
        set({ renderStatus: status, renderError: error, renderTimeMs: timeMs }),

      getActiveContent: () => {
        const { files, activeFile } = get()
        return files.find((f) => f.path === activeFile)?.content ?? ''
      },

      getFilesMap: () => {
        const map = new Map<string, string>()
        for (const f of get().files) {
          map.set(f.path, f.content)
          const basename = f.path.split('/').pop()
          if (basename) map.set(basename, f.content)
        }
        return map
      },

      insertAtCursor: () => {},
      requestInsert: (code) => set({ pendingInsert: code }),
      clearPendingInsert: () => set({ pendingInsert: null }),
    }),
    {
      name: 'plantuml-studio-project',
      partialize: (state) => ({
        files: state.files,
        activeFile: state.activeFile,
        theme: state.theme,
        darkDiagram: state.darkDiagram,
      }),
    },
  ),
)
