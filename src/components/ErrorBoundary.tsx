import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('PlantUML Studio error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] p-8 text-[var(--text-primary)]">
          <h1 className="text-lg font-semibold text-[var(--error)]">
            Произошла ошибка
          </h1>
          <p className="max-w-lg text-center text-sm text-[var(--text-secondary)]">
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              localStorage.removeItem('plantuml-studio-project')
              window.location.reload()
            }}
          >
            Сбросить данные и перезагрузить
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
