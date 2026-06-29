import { useCallback, useEffect, useRef } from 'react'
import type { Monaco } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import Editor from '@monaco-editor/react'
import { useProjectStore } from '../../store/projectStore'

const PLANTUML_KEYWORDS = [
  '@startuml',
  '@enduml',
  '@startmindmap',
  '@endmindmap',
  'participant',
  'actor',
  'database',
  'entity',
  'class',
  'interface',
  'enum',
  'package',
  'namespace',
  'state',
  'note',
  'box',
  'end box',
  'alt',
  'else',
  'end',
  'par',
  'loop',
  'opt',
  'break',
  'critical',
  'group',
  'title',
  'skinparam',
  'autonumber',
  'hide',
  'show',
  'left',
  'right',
  'of',
  'over',
  'as',
  '!include',
  '!define',
  '!ifdef',
  '!endif',
]

function registerPlantUmlLanguage(monaco: Monaco) {
  const id = 'plantuml'

  if (monaco.languages.getLanguages().some((l: { id: string }) => l.id === id)) {
    return
  }

  monaco.languages.register({ id })

  monaco.languages.setMonarchTokensProvider(id, {
    tokenizer: {
      root: [
        [/'.*$/, 'comment'],
        [/".*"/, 'string'],
        [
          new RegExp(`\\b(${PLANTUML_KEYWORDS.join('|')})\\b`),
          'keyword',
        ],
        [/[{}|<>o\-*#]+/, 'operator'],
        [/[a-zA-Z_][\w]*/, 'identifier'],
      ],
    },
  })

  monaco.editor.defineTheme('plantuml-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '3ecf8e', fontStyle: 'bold' },
      { token: 'comment', foreground: '6a7f9a', fontStyle: 'italic' },
      { token: 'string', foreground: 'fbbf24' },
      { token: 'operator', foreground: '94a3b8' },
    ],
    colors: {
      'editor.background': '#1a2332',
    },
  })

  monaco.editor.defineTheme('plantuml-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '059669', fontStyle: 'bold' },
      { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
      { token: 'string', foreground: 'd97706' },
    ],
    colors: {
      'editor.background': '#ffffff',
    },
  })
}

export function CodeEditor() {
  const activeFile = useProjectStore((s) => s.activeFile)
  const files = useProjectStore((s) => s.files)
  const theme = useProjectStore((s) => s.theme)
  const updateFileContent = useProjectStore((s) => s.updateFileContent)
  const pendingInsert = useProjectStore((s) => s.pendingInsert)
  const clearPendingInsert = useProjectStore((s) => s.clearPendingInsert)

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const content = files.find((f) => f.path === activeFile)?.content ?? ''

  const handleMount = useCallback(
    (ed: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef.current = ed
      registerPlantUmlLanguage(monaco)
      monaco.editor.setTheme(
        theme === 'dark' ? 'plantuml-dark' : 'plantuml-light',
      )
    },
    [theme],
  )

  useEffect(() => {
    if (!pendingInsert || !editorRef.current) return

    const ed = editorRef.current
    const selection = ed.getSelection()
    const model = ed.getModel()
    if (!model || !selection) return

    const op = {
      range: selection,
      text: pendingInsert,
      forceMoveMarkers: true,
    }
    ed.executeEdits('snippet', [op])
    ed.focus()
    clearPendingInsert()
  }, [pendingInsert, clearPendingInsert])

  return (
    <div className="h-full w-full">
      <Editor
        key={activeFile}
        height="100%"
        language="plantuml"
        theme={theme === 'dark' ? 'plantuml-dark' : 'plantuml-light'}
        value={content}
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
