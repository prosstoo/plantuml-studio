const MAX_INCLUDE_DEPTH = 10

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '').trim()
}

function findFile(files: Map<string, string>, includePath: string): string | undefined {
  const normalized = normalizePath(includePath)

  if (files.has(normalized)) {
    return files.get(normalized)
  }

  const basename = normalized.split('/').pop()
  if (basename && files.has(basename)) {
    return files.get(basename)
  }

  for (const [key, content] of files) {
    if (key.endsWith('/' + basename) || key.endsWith('\\' + basename)) {
      return content
    }
  }

  return undefined
}

export function resolveIncludes(
  source: string,
  files: Map<string, string>,
  depth = 0,
  stack: string[] = [],
): string {
  if (depth > MAX_INCLUDE_DEPTH) {
    throw new Error('Превышена максимальная глубина !include (возможен цикл)')
  }

  return source.replace(/^!include\s+(.+)$/gm, (_, rawPath: string) => {
    const includePath = rawPath.trim().replace(/^["']|["']$/g, '')

    if (stack.includes(includePath)) {
      throw new Error(`Циклический !include: ${[...stack, includePath].join(' → ')}`)
    }

    const content = findFile(files, includePath)
    if (content === undefined) {
      throw new Error(`Файл не найден: ${includePath}`)
    }

    return resolveIncludes(content, files, depth + 1, [...stack, includePath])
  })
}
