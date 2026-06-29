/** Строки, вставленные пресетом оформления — не подсвечивать в редакторе */
export const INJECTED_THEME_FILE = '__theme__'

const NOISE_PATTERNS = [
  /PlantUML version/i,
  /This version of PlantUML/i,
  /days old/i,
  /so you should\s*$/i,
  /consider upgrading/i,
  /plantuml\.com\/download/i,
  /Unknown compile time/i,
  /^\$version\$$/,
  /^\$git\.commit\.id\$$/,
  /^\.\.\.\s*$/i,
  /skipping \d+ lines/i,
  /^@startuml\b/i,
  /^@enduml\b/i,
  /^skinparam\s+/i,
  /^' Стиль:/i,
]

export function isNoiseErrorLine(line: string): boolean {
  const t = line.trim()
  if (!t) return true
  return NOISE_PATTERNS.some((p) => p.test(t))
}

export function stripPlantUmlVersionNoise(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => !isNoiseErrorLine(line))
    .join('\n')
    .trim()
}

export function formatPlantUmlError(raw: string): string {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')

  const fromLine = lines.find((l) => /\[From\s+.+\(line\s+\d+\)\s*\]/i.test(l))
  const syntaxLine = lines.find((l) => /syntax error/i.test(l))

  const meaningful = lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => !isNoiseErrorLine(l))

  const fromIdx = meaningful.findIndex((l) => /\[From\s+.+\(line\s+\d+\)\s*\]/i.test(l))
  let context: string[] = []

  if (fromIdx >= 0) {
    const afterFrom = meaningful.slice(fromIdx + 1)
    const syntaxIdx = afterFrom.findIndex((l) => /syntax error/i.test(l))
    const beforeSyntax =
      syntaxIdx >= 0 ? afterFrom.slice(0, syntaxIdx) : afterFrom
    context = beforeSyntax.slice(-5)
  } else if (syntaxLine) {
    const syntaxPos = lines.findIndex((l) => l === syntaxLine)
    const start = Math.max(0, syntaxPos - 5)
    context = lines
      .slice(start, syntaxPos)
      .map((l) => l.trim())
      .filter((l) => l && !isNoiseErrorLine(l))
  }

  const parts: string[] = []
  if (fromLine && !isNoiseErrorLine(fromLine)) parts.push(fromLine.trim())
  if (context.length > 0) {
    parts.push('', 'Контекст:', ...context.map((l) => `  ${l}`))
  }
  if (syntaxLine) {
    parts.push('', syntaxLine.trim())
  }

  if (parts.length === 0) {
    const stripped = stripPlantUmlVersionNoise(raw)
    return stripped || 'Ошибка синтаксиса PlantUML'
  }

  return parts.join('\n')
}

/** Строка с опечаткой — обычно последняя перед «Syntax Error» */
export function findOffendingLineText(error: string): string | null {
  const lines = error
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  const syntaxIdx = lines.findIndex((l) => /syntax error/i.test(l))
  if (syntaxIdx <= 0) return null

  for (let i = syntaxIdx - 1; i >= 0; i--) {
    const line = lines[i]
    if (isNoiseErrorLine(line)) continue
    if (/^\[From\s+/i.test(line)) break
    if (/^(end|else|endif|loop|alt|opt|par|break|group)\b/i.test(line)) continue
    return line
  }

  return null
}

export function findLineInContent(content: string, text: string): number | null {
  const needle = text.trim()
  if (!needle) return null
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === needle) return i + 1
  }
  return null
}
