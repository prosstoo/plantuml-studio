import type { Monaco } from '@monaco-editor/react'

const PLAIN_KEYWORDS = [
  'participant',
  'actor',
  'database',
  'class',
  'interface',
  'enum',
  'package',
  'namespace',
  'state',
  'note',
  'box',
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
]

let registered = false

export function registerPlantUmlLanguage(monaco: Monaco): void {
  if (registered) return

  const id = 'plantuml'

  if (!monaco.languages.getLanguages().some((l: { id: string }) => l.id === id)) {
    monaco.languages.register({ id })
  }

  // Monarch treats @ as state reference — never put @keyword inside regex alternations.
  monaco.languages.setMonarchTokensProvider(id, {
    tokenizer: {
      root: [
        [/'.*$/, 'comment'],
        [/".*"/, 'string'],
        [/@[a-zA-Z][\w]*/, 'keyword'],
        [/![a-zA-Z][\w]*/, 'keyword'],
        [new RegExp(`\\b(${PLAIN_KEYWORDS.join('|')})\\b`), 'keyword'],
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

  registered = true
}

export function getMonacoTheme(theme: 'dark' | 'light'): string {
  return theme === 'dark' ? 'plantuml-dark' : 'plantuml-light'
}
