type RenderOptions = {
  dark?: boolean
}

let enginePromise: Promise<typeof import('@plantuml/core/plantuml.js')> | null = null

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

export async function renderToSvg(
  source: string,
  options: RenderOptions = {},
): Promise<string> {
  ensureVizLoaded()
  const { renderToString } = await loadEngine()
  const lines = source.split('\n')

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Превышено время ожидания рендеринга (30 с)'))
    }, 30000)

    try {
      renderToString(
        lines,
        (svg: string) => {
          clearTimeout(timeout)
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
