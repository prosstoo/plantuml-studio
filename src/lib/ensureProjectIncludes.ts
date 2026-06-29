import type { ProjectFile } from '../store/projectStore'
import { normalizePath } from './includeResolver'
import { getBundledInclude } from './bundledIncludes'

const INCLUDE_RE = /^!include\s+(.+)$/gm

function includePath(raw: string): string {
  return normalizePath(raw.trim().replace(/^["']|["']$/g, ''))
}

function hasFile(files: ProjectFile[], includePath: string): boolean {
  const basename = includePath.split('/').pop() ?? includePath
  return files.some(
    (f) =>
      f.path === includePath ||
      f.path === basename ||
      f.path.endsWith('/' + basename),
  )
}

/** Добавляет встроенные файлы (_common.puml и др.), если на них есть !include */
export function ensureBundledIncludes(files: ProjectFile[]): ProjectFile[] {
  const result = [...files]
  const needed = new Set<string>()

  for (const file of files) {
    for (const match of file.content.matchAll(INCLUDE_RE)) {
      needed.add(includePath(match[1]))
    }
  }

  for (const path of needed) {
    if (hasFile(result, path)) continue
    const content = getBundledInclude(path)
    if (content !== undefined) {
      const basename = path.split('/').pop() ?? path
      result.push({ path: basename, content })
    }
  }

  return result
}
