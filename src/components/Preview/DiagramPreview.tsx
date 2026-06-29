import { useEffect, useRef, useCallback } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import { useProjectStore } from '../../store/projectStore'
import { buildPreparedSource } from '../../lib/renderPipeline'
import { renderToSvg } from '../../lib/plantumlRenderer'
import { mapErrorToEditorLines } from '../../lib/parsePlantUmlError'
import { formatPlantUmlError } from '../../lib/plantumlErrorFormat'
import { CopyableError } from './CopyableError'
import {
  DIAGRAM_ZOOM_PROPS,
  ZOOM_ANIMATION_EASING,
  ZOOM_ANIMATION_MS,
  ZOOM_BUTTON_STEP,
} from '../../lib/diagramZoomConfig'

export function DiagramPreview() {
  const files = useProjectStore((s) => s.files)
  const activeFile = useProjectStore((s) => s.activeFile)
  const darkDiagram = useProjectStore((s) => s.darkDiagram)
  const diagramStylePreset = useProjectStore((s) => s.diagramStylePreset)
  const autoRender = useProjectStore((s) => s.autoRender)
  const renderVersion = useProjectStore((s) => s.renderVersion)
  const debounceMs = useProjectStore((s) => s.debounceMs)
  const svg = useProjectStore((s) => s.svg)
  const renderStatus = useProjectStore((s) => s.renderStatus)
  const renderError = useProjectStore((s) => s.renderError)
  const renderTimeMs = useProjectStore((s) => s.renderTimeMs)
  const setSvg = useProjectStore((s) => s.setSvg)
  const setRenderStatus = useProjectStore((s) => s.setRenderStatus)
  const triggerRender = useProjectStore((s) => s.triggerRender)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const renderIdRef = useRef(0)
  const zoomRef = useRef({
    zoomIn: () => {},
    zoomOut: () => {},
    resetTransform: () => {},
  })

  const activeContent =
    files.find((f) => f.path === activeFile)?.content ?? ''

  const runRender = useCallback(async () => {
    const renderId = ++renderIdRef.current
    setRenderStatus('loading')
    const start = performance.now()

    try {
      const filesMap = new Map<string, string>()
      for (const f of files) {
        filesMap.set(f.path, f.content)
        const basename = f.path.split('/').pop()
        if (basename) filesMap.set(basename, f.content)
      }

      const { prepared } = buildPreparedSource(
        activeContent,
        filesMap,
        activeFile,
        { stylePreset: diagramStylePreset },
      )
      const result = await renderToSvg(prepared, {
        dark: darkDiagram,
        stylePreset: diagramStylePreset,
        alreadyPrepared: true,
      })

      if (renderId !== renderIdRef.current) return

      const elapsed = Math.round(performance.now() - start)
      setSvg(result)
      setRenderStatus('success', null, elapsed, [])
    } catch (err) {
      if (renderId !== renderIdRef.current) return

      const elapsed = Math.round(performance.now() - start)
      const rawMessage =
        err instanceof Error ? err.message : 'Неизвестная ошибка рендеринга'
      const message = formatPlantUmlError(rawMessage)

      let lineMap: ReturnType<typeof buildPreparedSource>['lineMap'] = []
      try {
        const filesMap = new Map<string, string>()
        for (const f of files) {
          filesMap.set(f.path, f.content)
          const basename = f.path.split('/').pop()
          if (basename) filesMap.set(basename, f.content)
        }
        lineMap = buildPreparedSource(activeContent, filesMap, activeFile, {
          stylePreset: diagramStylePreset,
        }).lineMap
      } catch {
        lineMap = []
      }

      const errorLines = mapErrorToEditorLines(
        rawMessage,
        lineMap,
        activeFile,
        activeContent,
        files.map((f) => f.path),
      )

      setSvg(null)
      setRenderStatus('error', message, elapsed, errorLines)
    }
  }, [
    activeContent,
    activeFile,
    files,
    darkDiagram,
    diagramStylePreset,
    setSvg,
    setRenderStatus,
  ])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!autoRender && renderVersion === 0) return

    const delay = autoRender ? debounceMs : 0

    timerRef.current = setTimeout(runRender, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [
    activeContent,
    files,
    darkDiagram,
    diagramStylePreset,
    debounceMs,
    autoRender,
    renderVersion,
    runRender,
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
            onClick={() => triggerRender()}
            title="Обновить диаграмму"
          >
            ↻
          </button>
          <button
            type="button"
            className="preview-btn"
            onClick={() => zoomRef.current.zoomOut()}
            title="Уменьшить"
          >
            −
          </button>
          <button
            type="button"
            className="preview-btn"
            onClick={() => zoomRef.current.resetTransform()}
            title="По размеру"
          >
            Fit
          </button>
          <button
            type="button"
            className="preview-btn"
            onClick={() => zoomRef.current.zoomIn()}
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

        {renderStatus === 'error' && !svg && renderError && (
          <div className="flex h-full items-center justify-center overflow-auto p-6">
            <CopyableError
              title="Ошибка рендеринга"
              text={renderError}
              hint="Выделите текст или нажмите «Копировать», чтобы отправить ошибку в чат или баг-трекер."
            />
          </div>
        )}

        {svg && (
          <TransformWrapper
            initialScale={1}
            {...DIAGRAM_ZOOM_PROPS}
          >
            {({ zoomIn, zoomOut, resetTransform }) => {
              zoomRef.current = {
                zoomIn: () =>
                  zoomIn(ZOOM_BUTTON_STEP, ZOOM_ANIMATION_MS, ZOOM_ANIMATION_EASING),
                zoomOut: () =>
                  zoomOut(ZOOM_BUTTON_STEP, ZOOM_ANIMATION_MS, ZOOM_ANIMATION_EASING),
                resetTransform: () =>
                  resetTransform(ZOOM_ANIMATION_MS, ZOOM_ANIMATION_EASING),
              }
              return (
                <TransformComponent
                  wrapperClass="diagram-zoom-wrapper !w-full !h-full"
                  contentClass="diagram-zoom-content !w-full !h-full flex items-center justify-center p-8"
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
        {renderStatus === 'error' && renderError ? (
          <div className="flex items-start gap-2">
            <span className="min-w-0 flex-1 truncate" title={renderError}>
              Ошибка: {renderError.split('\n')[0]}
            </span>
            <button
              type="button"
              className="preview-btn shrink-0"
              onClick={() => navigator.clipboard.writeText(renderError)}
              title="Копировать полный текст ошибки"
            >
              Копировать
            </button>
          </div>
        ) : (
          statusText()
        )}
      </div>
    </div>
  )
}
