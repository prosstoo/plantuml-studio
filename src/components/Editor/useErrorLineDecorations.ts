import { useEffect, useRef, type RefObject } from 'react'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useProjectStore } from '../../store/projectStore'
import { fileMatches } from '../../lib/parsePlantUmlError'

export function useErrorLineDecorations(
  editorRef: RefObject<editor.IStandaloneCodeEditor | null>,
  monacoRef: RefObject<Monaco | null>,
  activeFile: string,
) {
  const renderErrorLines = useProjectStore((s) => s.renderErrorLines)
  const decorationIdsRef = useRef<string[]>([])
  const lastScrolledErrorRef = useRef<string | null>(null)

  useEffect(() => {
    const ed = editorRef.current
    const monaco = monacoRef.current
    const model = ed?.getModel()
    if (!ed || !monaco || !model) return

    const highlights = renderErrorLines.filter((e) =>
      fileMatches(activeFile, e.file),
    )

    const decorations: editor.IModelDeltaDecoration[] = highlights.map((h) => {
      const line = Math.min(Math.max(1, h.line), model.getLineCount())
      return {
        range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
        options: {
          isWholeLine: true,
          className: 'plantuml-error-line',
          glyphMarginClassName: 'plantuml-error-glyph',
          overviewRuler: {
            color: '#f87171',
            position: monaco.editor.OverviewRulerLane.Right,
          },
          minimap: {
            color: '#f87171',
            position: monaco.editor.MinimapPosition.Inline,
          },
          hoverMessage: h.message
            ? { value: h.message }
            : { value: 'Ошибка PlantUML на этой строке' },
        },
      }
    })

    decorationIdsRef.current = ed.deltaDecorations(
      decorationIdsRef.current,
      decorations,
    )

    if (highlights.length > 0) {
      const scrollKey = highlights.map((h) => `${h.file}:${h.line}`).join(',')
      if (scrollKey !== lastScrolledErrorRef.current) {
        lastScrolledErrorRef.current = scrollKey
        ed.revealLineInCenter(highlights[0].line)
      }
    } else {
      lastScrolledErrorRef.current = null
    }
  }, [renderErrorLines, activeFile, editorRef, monacoRef])
}
