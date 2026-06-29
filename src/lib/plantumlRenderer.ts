import { applyDiagramTheme, type DiagramStylePreset } from './diagramThemes'
import { extractPlantUmlErrorFromSvg, isPlantUmlErrorSvg } from './plantumlErrorSvg'
import { formatPlantUmlError } from './plantumlErrorFormat'

type RenderOptions = {
  dark?: boolean
  stylePreset?: DiagramStylePreset
}

let enginePromise: Promise<typeof import('@plantuml/core/plantuml.js')> | null = null

const renderCache = new Map<string, string>()

function loadEngine() {
  if (!enginePromise) {
    enginePromise = import('@plantuml/core/plantuml.js')
  }
  return enginePromise
}

function ensureVizLoaded(): void {
  if (typeof window !== 'undefined' && !(window as Window & { Viz?: unknown }).Viz) {
    throw new Error(
      'Graphviz не загружен. Проверьте, что viz-global.js доступен.',
    )
  }
}

function hashSource(source: string, options: RenderOptions): string {
  const key = `${options.dark ? 'd' : 'l'}:${options.stylePreset ?? 'none'}:${source}`
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0
  }
  return h.toString(36)
}

export function prepareSource(
  source: string,
  options: RenderOptions = {},
): string {
  let result = source
  if (options.stylePreset && options.stylePreset !== 'none') {
    result = applyDiagramTheme(result, options.stylePreset)
  }
  return result
}

export function clearRenderCache(): void {
  renderCache.clear()
}

export async function renderToSvg(
  source: string,
  options: RenderOptions & { alreadyPrepared?: boolean } = {},
): Promise<string> {
  ensureVizLoaded()

  const prepared = options.alreadyPrepared
    ? source
    : prepareSource(source, options)
  const cacheKey = hashSource(prepared, options)
  const cached = renderCache.get(cacheKey)
  if (cached) return cached

  const { renderToString } = await loadEngine()
  const lines = prepared.split('\n')

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Превышено время ожидания рендеринга (30 с)'))
    }, 30000)

    try {
      renderToString(
        lines,
        (svg: string) => {
          clearTimeout(timeout)
          if (isPlantUmlErrorSvg(svg)) {
            const detail = extractPlantUmlErrorFromSvg(svg)
            reject(
              new Error(
                detail ? formatPlantUmlError(detail) : 'Ошибка синтаксиса PlantUML',
              ),
            )
            return
          }
          renderCache.set(cacheKey, svg)
          if (renderCache.size > 20) {
            const first = renderCache.keys().next().value
            if (first) renderCache.delete(first)
          }
          resolve(svg)
        },
        (error: string) => {
          clearTimeout(timeout)
          reject(new Error(error || 'Ошибка рендеринга PlantUML'))
        },
        options.dark ? { dark: true } : undefined,
      )
    } catch (err) {
      clearTimeout(timeout)
      reject(err instanceof Error ? err : new Error(String(err)))
    }
  })
}

export function ensurePlantUmlWrapper(source: string): string {
  const trimmed = source.trim()
  if (trimmed.includes('@startuml')) {
    return source
  }
  return `@startuml\n${source}\n@enduml`
}
