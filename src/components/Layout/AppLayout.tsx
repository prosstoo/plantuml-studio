import { useCallback, useEffect, useRef, useState } from 'react'
import { FileTree } from '../FileTree/FileTree'
import { SidebarTools } from '../Sidebar/SidebarTools'
import { CodeEditor } from '../Editor/CodeEditor'
import { DiagramPreview } from '../Preview/DiagramPreview'

const MIN_SIDEBAR = 200
const MAX_SIDEBAR = 420
const MIN_EDITOR = 280
const MIN_PREVIEW = 300

export function AppLayout() {
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const [editorWidthPercent, setEditorWidthPercent] = useState(50)
  const [resizingSidebar, setResizingSidebar] = useState(false)
  const [resizingSplit, setResizingSplit] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  const handleSidebarMouseDown = useCallback(() => setResizingSidebar(true), [])
  const handleSplitMouseDown = useCallback(() => setResizingSplit(true), [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingSidebar) {
        setSidebarWidth(Math.min(MAX_SIDEBAR, Math.max(MIN_SIDEBAR, e.clientX)))
      }
      if (resizingSplit && mainRef.current) {
        const rect = mainRef.current.getBoundingClientRect()
        const relativeX = e.clientX - rect.left - sidebarWidth
        const percent = (relativeX / (rect.width - sidebarWidth)) * 100
        setEditorWidthPercent(Math.min(75, Math.max(25, percent)))
      }
    }

    const handleMouseUp = () => {
      setResizingSidebar(false)
      setResizingSplit(false)
    }

    if (resizingSidebar || resizingSplit) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [resizingSidebar, resizingSplit, sidebarWidth])

  return (
    <div className="flex flex-1 overflow-hidden" ref={mainRef}>
      <aside
        className="flex shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]"
        style={{ width: sidebarWidth }}
      >
        <div className="flex-1 overflow-hidden" style={{ minHeight: MIN_EDITOR }}>
          <FileTree />
        </div>
        <div
          className="border-t border-[var(--border)]"
          style={{ height: '42%', minHeight: 200 }}
        >
          <SidebarTools />
        </div>
      </aside>

      <div
        className="resize-handle"
        onMouseDown={handleSidebarMouseDown}
        role="separator"
        aria-orientation="vertical"
      />

      <div
        className="flex shrink-0 flex-col overflow-hidden"
        style={{
          width: `calc((100% - ${sidebarWidth}px - 8px) * ${editorWidthPercent / 100})`,
          minWidth: MIN_EDITOR,
        }}
      >
        <div className="border-b border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
          Редактор
        </div>
        <div className="flex-1 overflow-hidden">
          <CodeEditor />
        </div>
      </div>

      <div
        className="resize-handle"
        onMouseDown={handleSplitMouseDown}
        role="separator"
        aria-orientation="vertical"
      />

      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden"
        style={{ minWidth: MIN_PREVIEW }}
      >
        <DiagramPreview />
      </div>
    </div>
  )
}
