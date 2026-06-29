import { getBundledInclude } from './bundledIncludes'

const MAX_INCLUDE_DEPTH = 10

export interface SourceLineRef {
  file: string
  line: number
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').trim()
}

function findFileKey(
  files: Map<string, string>,
  includePath: string,
): string | undefined {
  const normalized = normalizePath(includePath)

  if (files.has(normalized)) {
    return normalized
  }

  const basename = normalized.split('/').pop()
  if (basename && files.has(basename)) {
    return basename
  }

  for (const key of files.keys()) {
    if (key.endsWith('/' + basename) || key.endsWith('\\' + basename)) {
      return key
    }
  }

  return undefined
}

export function resolveIncludesWithLineMap(
  source: string,
  files: Map<string, string>,
  currentFile: string,
  depth = 0,
  stack: string[] = [],
): { resolved: string; lineMap: SourceLineRef[] } {
  if (depth > MAX_INCLUDE_DEPTH) {
    throw new Error('Превышена максимальная глубина !include (возможен цикл)')
  }

  const normalizedSource = source.replace(/\r\n/g, '\n')
  const lineMap: SourceLineRef[] = []
  const outLines: string[] = []
  const lines = normalizedSource.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '')
    const includeMatch = line.match(/^!include\s+(.+)$/)

    if (!includeMatch) {
      outLines.push(line)
      lineMap.push({ file: currentFile, line: i + 1 })
      continue
    }

    const includePath = includeMatch[1].trim().replace(/^["']|["']$/g, '')

    if (stack.includes(includePath)) {
      throw new Error(`Циклический !include: ${[...stack, includePath].join(' → ')}`)
    }

    const fileKey = findFileKey(files, includePath)
    let includedContent: string
    let includedFile: string

    if (fileKey !== undefined) {
      includedContent = files.get(fileKey)!
      includedFile = fileKey
    } else {
      const bundled = getBundledInclude(includePath)
      if (bundled === undefined) {
        throw new Error(`Файл не найден: ${includePath}`)
      }
      includedContent = bundled
      includedFile = normalizePath(includePath.split('/').pop() ?? includePath)
    }

    const nested = resolveIncludesWithLineMap(
      includedContent,
      files,
      includedFile,
      depth + 1,
      [...stack, includePath],
    )

    for (const nestedLine of nested.resolved.split('\n')) {
      outLines.push(nestedLine)
    }
    lineMap.push(...nested.lineMap)
  }

  return { resolved: outLines.join('\n'), lineMap }
}

export function resolveIncludes(
  source: string,
  files: Map<string, string>,
  currentFile = 'main.puml',
): string {
  return resolveIncludesWithLineMap(source, files, currentFile).resolved
}
