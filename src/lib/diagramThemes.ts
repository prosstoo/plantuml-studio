import type { SourceLineRef } from './includeResolver'

export type DiagramStylePreset = 'none' | 'espц' | 'modern' | 'minimal'

export interface DiagramStyleOption {
  id: DiagramStylePreset
  label: string
  description: string
}

export const DIAGRAM_STYLE_OPTIONS: DiagramStyleOption[] = [
  { id: 'none', label: 'Без пресета', description: 'Только ваш код' },
  { id: 'espц', label: 'Корпоративный', description: 'Стиль ФМ ЭСПЦ' },
  { id: 'modern', label: 'Современный', description: 'Мягкие цвета и отступы' },
  { id: 'minimal', label: 'Минимальный', description: 'Чистый ч/б' },
]

const THEME_SKINPARAMS: Record<Exclude<DiagramStylePreset, 'none'>, string> = {
  espц: `' Стиль: корпоративный
skinparam roundcorner 8
skinparam shadowing false
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam BoxPadding 12
skinparam ParticipantPadding 24
skinparam sequenceArrowThickness 2
skinparam ParticipantBorderColor #64748b
skinparam ActorBorderColor #64748b
skinparam DatabaseBorderColor #64748b
skinparam SequenceLifeLineBorderColor #94a3b8
skinparam SequenceBoxBorderColor #64748b`,
  modern: `' Стиль: современный
skinparam roundcorner 12
skinparam shadowing false
skinparam defaultFontName "Inter"
skinparam defaultFontSize 12
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam BoxPadding 16
skinparam ParticipantPadding 28
skinparam sequenceArrowThickness 1.5
skinparam ParticipantBackgroundColor #f8fafc
skinparam ActorBackgroundColor #f0fdf4
skinparam DatabaseBackgroundColor #eff6ff
skinparam ParticipantBorderColor #cbd5e1
skinparam ActorBorderColor #86efac
skinparam DatabaseBorderColor #93c5fd`,
  minimal: `' Стиль: минимальный
skinparam shadowing false
skinparam roundcorner 0
skinparam defaultFontName "Segoe UI"
skinparam sequenceMessageAlign center
skinparam responseMessageBelowArrow true
skinparam BoxPadding 8
skinparam ParticipantPadding 16
skinparam sequenceArrowThickness 1
skinparam ParticipantBackgroundColor #ffffff
skinparam ActorBackgroundColor #ffffff
skinparam DatabaseBackgroundColor #ffffff
skinparam ParticipantBorderColor #000000
skinparam ActorBorderColor #000000
skinparam DatabaseBorderColor #000000`,
}

export function getThemeSkinparams(preset: DiagramStylePreset): string | null {
  if (preset === 'none') return null
  return THEME_SKINPARAMS[preset]
}

export function hasCustomSkinparams(source: string): boolean {
  return /^\s*skinparam\s+/m.test(source)
}

export function applyDiagramThemeWithLineMap(
  source: string,
  preset: DiagramStylePreset,
  baseLineMap: SourceLineRef[],
): { source: string; lineMap: SourceLineRef[] } {
  const skinparams = getThemeSkinparams(preset)
  if (!skinparams || hasCustomSkinparams(source) || preset === 'none') {
    return { source, lineMap: baseLineMap }
  }

  const startumlMatch = source.match(/^(@startuml[^\n]*\n)/m)
  if (!startumlMatch) {
    return { source, lineMap: baseLineMap }
  }

  const themeLines = skinparams.split('\n')
  const normalized = source.replace(/\r\n/g, '\n')
  const sourceLines = normalized.split('\n')

  const insertPos = startumlMatch.index! + startumlMatch[0].length
  const prepared =
    normalized.slice(0, insertPos) +
    skinparams +
    '\n' +
    normalized.slice(insertPos)

  const lineMap: SourceLineRef[] = []

  for (let i = 0; i < sourceLines.length; i++) {
    const lineNum = i + 1
    const ref = baseLineMap[i] ?? { file: 'main.puml', line: lineNum }

    if (lineNum === 1) {
      lineMap.push(ref)
      for (let t = 0; t < themeLines.length; t++) {
        lineMap.push({ file: '__theme__', line: 0 })
      }
    } else {
      lineMap.push(ref)
    }
  }

  return { source: prepared, lineMap }
}

export function applyDiagramTheme(
  source: string,
  preset: DiagramStylePreset,
): string {
  return applyDiagramThemeWithLineMap(source, preset, []).source
}
