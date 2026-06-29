import { SnippetPanel } from '../SnippetPanel/SnippetPanel'
import { LinkBuilder } from '../LinkBuilder/LinkBuilder'
import { ColorPanel } from '../ColorPanel/ColorPanel'
import { useProjectStore, type SidebarTab } from '../../store/projectStore'

const TABS: { id: SidebarTab; label: string }[] = [
  { id: 'snippets', label: 'Сниппеты' },
  { id: 'links', label: 'Связи' },
  { id: 'colors', label: 'Цвета' },
]

export function SidebarTools() {
  const sidebarTab = useProjectStore((s) => s.sidebarTab)
  const setSidebarTab = useProjectStore((s) => s.setSidebarTab)

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`sidebar-tab ${sidebarTab === tab.id ? 'sidebar-tab-active' : ''}`}
            onClick={() => setSidebarTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {sidebarTab === 'snippets' && <SnippetPanel />}
        {sidebarTab === 'links' && <LinkBuilder />}
        {sidebarTab === 'colors' && <ColorPanel />}
      </div>
    </div>
  )
}
