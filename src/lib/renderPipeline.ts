import { resolveIncludesWithLineMap, type SourceLineRef } from './includeResolver'
import {
  applyDiagramThemeWithLineMap,
  type DiagramStylePreset,
} from './diagramThemes'

function ensurePlantUmlWrapper(source: string): string {
  const trimmed = source.trim()
  if (trimmed.includes('@startuml')) {
    return source
  }
  return `@startuml\n${source}\n@enduml`
}

export type RenderBuildOptions = {
  stylePreset?: DiagramStylePreset
}

/** Собирает итоговый текст для PlantUML и карту строк до/после include и темы */
export function buildPreparedSource(
  activeContent: string,
  filesMap: Map<string, string>,
  activeFile: string,
  options: RenderBuildOptions = {},
): { prepared: string; lineMap: SourceLineRef[] } {
  const { resolved, lineMap: includeMap } = resolveIncludesWithLineMap(
    activeContent,
    filesMap,
    activeFile,
  )
  const wrapped = ensurePlantUmlWrapper(resolved)
  const preset = options.stylePreset ?? 'none'
  const themed = applyDiagramThemeWithLineMap(wrapped, preset, includeMap)
  return { prepared: themed.source, lineMap: themed.lineMap }
}

export function isMappableLineRef(ref: SourceLineRef | undefined): ref is SourceLineRef {
  return !!ref && ref.file !== '__theme__' && ref.line > 0
}
