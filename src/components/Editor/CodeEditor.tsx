import { useCallback, useEffect, useRef } from 'react'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import Editor from '@monaco-editor/react'
import { useProjectStore } from '../../store/projectStore'
import { getMonacoTheme, registerPlantUmlLanguage } from '../../lib/monacoPlantuml'
import { useErrorLineDecorations } from './useErrorLineDecorations'
import { fileMatches } from '../../lib/parsePlantUmlError'

export function CodeEditor() {
  const activeFile = useProjectStore((s) => s.activeFile)
  const files = useProjectStore((s) => s.files)
  const theme = useProjectStore((s) => s.theme)
  const renderErrorLines = useProjectStore((s) => s.renderErrorLines)
  const updateFileContent = useProjectStore((s) => s.updateFileContent)
  const pendingInsert = useProjectStore((s) => s.pendingInsert)
  const clearPendingInsert = useProjectStore((s) => s.clearPendingInsert)

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const applyingExternalRef = useRef(false)

  const content = files.find((f) => f.path === activeFile)?.content ?? ''
  const activeErrorCount = renderErrorLines.filter((e) =>
    fileMatches(activeFile, e.file),
  ).length

  useErrorLineDecorations(editorRef, monacoRef, activeFile)

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
    const ed = editorRef.current
    const model = ed?.getModel()
    if (!ed || !model || model.getValue() === content) return

    const scrollTop = ed.getScrollTop()
    const position = ed.getPosition()

    applyingExternalRef.current = true
    model.setValue(content)
    if (position) {
      const lineCount = model.getLineCount()
      ed.setPosition({
        lineNumber: Math.min(position.lineNumber, lineCount),
        column: position.column,
      })
    }
    ed.setScrollTop(scrollTop)
    applyingExternalRef.current = false
  }, [content, activeFile])

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
    <div className="relative h-full w-full">
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
          if (value === undefined || applyingExternalRef.current) return
          updateFileContent(activeFile, value)
        }}
        onMount={handleMount}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          glyphMargin: true,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 12 },
        }}
      />
      {activeErrorCount > 0 && (
        <div className="pointer-events-none absolute bottom-2 left-3 rounded bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] text-[var(--error)] opacity-90">
          {activeErrorCount === 1
            ? 'Подсвечена строка с ошибкой'
            : `Подсвечено строк: ${activeErrorCount}`}
        </div>
      )}
    </div>
  )
}
