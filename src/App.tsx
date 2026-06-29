import { useEffect } from 'react'
import { Toolbar } from './components/Toolbar/Toolbar'
import { AppLayout } from './components/Layout/AppLayout'
import { useProjectStore } from './store/projectStore'
import './index.css'

function App() {
  const theme = useProjectStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <div className="flex h-full flex-col">
      <Toolbar />
      <AppLayout />
    </div>
  )
}

export default App
