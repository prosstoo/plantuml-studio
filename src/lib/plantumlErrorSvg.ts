import { isNoiseErrorLine, stripPlantUmlVersionNoise } from './plantumlErrorFormat'

const SKIP_PATTERNS = [
  /PlantUML version/i,
  /This version of PlantUML/i,
  /days old/i,
  /consider upgrading/i,
]

export function extractPlantUmlErrorFromSvg(svg: string): string | null {
  const isErrorSvg =
    /\[From\s+[^\]]+\]/i.test(svg) ||
    /syntax error/i.test(svg) ||
    /Cannot include/i.test(svg) ||
    /Error line/i.test(svg) ||
    (svg.includes('fill="#33FF02"') && svg.includes('@startuml'))

  if (!isErrorSvg) return null

  const lines = [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
    .map((m) =>
      m[1]
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .trim(),
    )
    .filter((t) => t.length > 0)
    .filter((t) => !SKIP_PATTERNS.some((p) => p.test(t)))
    .filter((t) => !isNoiseErrorLine(t))

  if (lines.length === 0) return 'Ошибка синтаксиса PlantUML (не удалось извлечь текст)'

  return stripPlantUmlVersionNoise(lines.join('\n'))
}

export function isPlantUmlErrorSvg(svg: string): boolean {
  return extractPlantUmlErrorFromSvg(svg) !== null
}
