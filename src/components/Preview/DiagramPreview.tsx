import { useEffect, useRef } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { useProjectStore } from '../../store/projectStore'
import { resolveIncludes } from '../../lib/includeResolver'
import { ensurePlantUmlWrapper, renderToSvg } from '../../lib/plantumlRenderer'

export function DiagramPreview() {
  const files = useProjectStore((s) => s.files)
  const activeFile = useProjectStore((s) => s.activeFile)
  const darkDiagram = useProjectStore((s) => s.darkDiagram)
  const debounceMs = useProjectStore((s) => s.debounceMs)
  const svg = useProjectStore((s) => s.svg)
  const renderStatus = useProjectStore((s) => s.renderStatus)
  const renderError = useProjectStore((s) => s.renderError)
  const renderTimeMs = useProjectStore((s) => s.renderTimeMs)
  const setSvg = useProjectStore((s) => s.setSvg)
  const setRenderStatus = useProjectStore((s) => s.setRenderStatus)
  const getFilesMap = useProjectStore((s) => s.getFilesMap)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transformRef = useRef<{ resetTransform: () => void; zoomIn: () => void; zoomOut: () => void } | null>(null)

  const activeContent =
    files.find((f) => f.path === activeFile)?.content ?? ''

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(async () => {
      setRenderStatus('loading')
      const start = performance.now()

      try {
        const filesMap = getFilesMap()
        const resolved = resolveIncludes(activeContent, filesMap)
        const wrapped = ensurePlantUmlWrapper(resolved)
        const result = await renderToSvg(wrapped, { dark: darkDiagram })
        const elapsed = Math.round(performance.now() - start)
        setSvg(result)
        setRenderStatus('success', null, elapsed)
      } catch (err) {
        const elapsed = Math.round(performance.now() - start)
        const message =
          err instanceof Error ? err.message : 'Неизвестная ошибка рендеринга'
        setSvg(null)
        setRenderStatus('error', message, elapsed)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [
    activeContent,
    files,
    darkDiagram,
    debounceMs,
    getFilesMap,
    setSvg,
    setRenderStatus,
  ])

  const statusText = () => {
    if (renderStatus === 'loading') return 'Рендеринг…'
    if (renderStatus === 'error') return `Ошибка: ${renderError}`
    if (renderStatus === 'success' && renderTimeMs !== null)
      return `OK · ${renderTimeMs} мс`
    return 'Готово'
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Превью
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="preview-btn"
            onClick={() => transformRef.current?.zoomOut()}
            title="Уменьшить"
          >
            −
          </button>
          <button
            type="button"
            className="preview-btn"
            onClick={() => transformRef.current?.resetTransform()}
            title="По размеру"
          >
            Fit
          </button>
          <button
            type="button"
            className="preview-btn"
            onClick={() => transformRef.current?.zoomIn()}
            title="Увеличить"
          >
            +
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-[var(--bg-tertiary)]">
        {renderStatus === 'loading' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20">
            <div className="rounded-lg bg-[var(--bg-secondary)] px-4 py-2 text-sm shadow-lg">
              Рендеринг диаграммы…
            </div>
          </div>
        )}

        {renderStatus === 'error' && !svg && (
          <div className="flex h-full items-center justify-center p-6">
            <div className="max-w-md rounded-lg border border-[var(--error)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--error)]">
              <p className="font-medium">Ошибка рендеринга</p>
              <p className="mt-2 text-[var(--text-secondary)]">{renderError}</p>
            </div>
          </div>
        )}

        {svg && (
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={5}
            centerOnInit
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => {
              transformRef.current = { zoomIn, zoomOut, resetTransform }
              return (
                <TransformComponent
                  wrapperClass="!w-full !h-full"
                  contentClass="!w-full !h-full flex items-center justify-center p-8"
                >
                  <div
                    className="diagram-svg"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                </TransformComponent>
              )
            }}
          </TransformWrapper>
        )}

        {!svg && renderStatus !== 'loading' && renderStatus !== 'error' && (
          <div className="flex h-full items-center justify-center text-[var(--text-secondary)]">
            Введите PlantUML-код для превью
          </div>
        )}
      </div>

      <div
        className={`border-t border-[var(--border)] px-3 py-1.5 text-xs ${
          renderStatus === 'error'
            ? 'text-[var(--error)]'
            : 'text-[var(--text-secondary)]'
        }`}
      >
        {statusText()}
      </div>
    </div>
  )
}
