'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error) => ReactNode
}

interface State {
  error: Error | null
}

export default class WikiErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    if (typeof window !== 'undefined') {
      console.error('[WikiErrorBoundary]', error, info)
    }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error)
      return (
        <div className="bg-white border border-red-ink/30 rounded-sm p-3">
          <div className="font-serif text-[13px] font-semibold uppercase tracking-[0.5px] text-red-ink mb-1">
            Render failed
          </div>
          <div className="font-mono text-[11px] text-ink">{this.state.error.message}</div>
        </div>
      )
    }
    return this.props.children
  }
}
