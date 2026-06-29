import { useCallback, useEffect, useRef } from 'react'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import Editor from '@monaco-editor/react'
import { useProjectStore } from '../../store/projectStore'
import { getMonacoTheme, registerPlantUmlLanguage } from '../../lib/monacoPlantuml'

export function CodeEditor() {
  const activeFile = useProjectStore((s) => s.activeFile)
  const files = useProjectStore((s) => s.files)
  const theme = useProjectStore((s) => s.theme)
  const updateFileContent = useProjectStore((s) => s.updateFileContent)
  const pendingInsert = useProjectStore((s) => s.pendingInsert)
  const clearPendingInsert = useProjectStore((s) => s.clearPendingInsert)

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const content = files.find((f) => f.path === activeFile)?.content ?? ''

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    monacoRef.current = monaco
    registerPlantUmlLanguage(monaco)
    monaco.editor.setTheme(getMonacoTheme(theme))
  }, [theme])

  const handleMount = useCallback(
    (ed: editor.IStandaloneCodeEditor) => {
      editorRef.current = ed
    },
    [],
  )

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(getMonacoTheme(theme))
    }
  }, [theme])

  useEffect(() => {
    if (!pendingInsert || !editorRef.current) return

    const ed = editorRef.current
    const selection = ed.getSelection()
    const model = ed.getModel()
    if (!model || !selection) return

    ed.executeEdits('snippet', [
      {
        range: selection,
        text: pendingInsert,
        forceMoveMarkers: true,
      },
    ])
    ed.focus()
    clearPendingInsert()
  }, [pendingInsert, clearPendingInsert])

  return (
    <div className="h-full w-full">
      <Editor
        key={activeFile}
        height="100%"
        language="plantuml"
        theme={getMonacoTheme(theme)}
        value={content}
        loading={
          <div className="flex h-full items-center justify-center text-sm text-[var(--text-secondary)]">
            Загрузка редактора…
          </div>
        }
        beforeMount={handleBeforeMount}
        onChange={(value) => {
          if (value !== undefined) {
            updateFileContent(activeFile, value)
          }
        }}
        onMount={handleMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 12 },
        }}
      />
    </div>
  )
}
