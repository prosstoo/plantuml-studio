import { normalizePath } from './includeResolver'
import type { SourceLineRef } from './includeResolver'
import {
  findLineInContent,
  findOffendingLineText,
  formatPlantUmlError,
} from './plantumlErrorFormat'
import { isMappableLineRef } from './renderPipeline'
export interface EditorErrorLine {
  file: string
  line: number
  message?: string
}

export function fileMatches(projectPath: string, errorFile: string): boolean {
  const norm = normalizePath(projectPath)
  const err = normalizePath(errorFile)
  const base = err.split('/').pop() ?? err
  return norm === err || norm === base || norm.endsWith('/' + base)
}

/** Найти строку с !include для указанного пути */
export function findIncludeLine(content: string, includePath: string): number | null {
  const target = normalizePath(includePath)
  const base = target.split('/').pop() ?? target
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^!include\s+(.+)$/)
    if (!m) continue
    const ref = m[1].trim().replace(/^["']|["']$/g, '')
    const refNorm = normalizePath(ref)
    const refBase = refNorm.split('/').pop() ?? refNorm
    if (refNorm === target || refBase === base) return i + 1
  }
  return null
}

export function parsePlantUmlError(error: string): {
  resolvedLines: number[]
  fileLines: { file: string; line: number }[]
} {
  const resolvedLines: number[] = []
  const fileLines: { file: string; line: number }[] = []

  for (const m of error.matchAll(
    /\[From\s+(.+?)\s+\(line\s+(\d+)\)\s*\]/gi,
  )) {
    const source = m[1].trim()
    const line = Number.parseInt(m[2], 10)
    if (Number.isNaN(line)) continue

    if (source === 'textarea' || source === 'string') {
      resolvedLines.push(line)
    } else {
      fileLines.push({ file: normalizePath(source), line })
    }
  }

  for (const m of error.matchAll(
    /(?:^|\s)(?:at\s+)?line\s+(\d+)(?:\s|:|$)/gim,
  )) {
    const line = Number.parseInt(m[1], 10)
    if (!Number.isNaN(line) && !resolvedLines.includes(line)) {
      resolvedLines.push(line)
    }
  }

  return { resolvedLines, fileLines }
}

export function mapErrorToEditorLines(
  error: string,
  lineMap: SourceLineRef[],
  activeFile: string,
  activeContent: string,
  projectFiles: string[],
): EditorErrorLine[] {
  const result: EditorErrorLine[] = []
  const seen = new Set<string>()
  const shortMessage = formatPlantUmlError(error).split('\n')[0]

  const add = (file: string, line: number, message?: string) => {
    const key = `${file}:${line}`
    if (seen.has(key) || line < 1) return
    seen.add(key)
    result.push({ file, line, message: message ?? shortMessage })
  }

  const { resolvedLines, fileLines } = parsePlantUmlError(error)

  for (const { file, line } of fileLines) {
    const match = projectFiles.find((p) => fileMatches(p, file))
    add(match ?? file, line)
  }

  for (const resolvedLine of resolvedLines) {
    const ref = lineMap[resolvedLine - 1]
    if (isMappableLineRef(ref)) {
      add(ref.file, ref.line)
    } else if (resolvedLine >= 1 && lineMap.length === 0) {
      add(activeFile, resolvedLine)
    }
  }

  const offender = findOffendingLineText(error)
  if (offender) {
    const line = findLineInContent(activeContent, offender)
    if (line) {
      add(activeFile, line, `Возможная опечатка: «${offender}»`)
    }
  }

  const missingInclude = error.match(/Файл не найден:\s*(.+)/)
  if (missingInclude) {
    const includePath = missingInclude[1].trim()
    const line = findIncludeLine(activeContent, includePath)
    if (line) add(activeFile, line, error.split('\n')[0])
  }

  const cycleInclude = error.match(/Циклический !include/)
  if (cycleInclude) {
    for (const m of activeContent.matchAll(/^!include\s+(.+)$/gm)) {
      const line = activeContent.slice(0, m.index).split('\n').length
      add(activeFile, line, error.split('\n')[0])
    }
  }

  return result
}
