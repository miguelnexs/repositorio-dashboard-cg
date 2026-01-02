import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('ErrorBoundary:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center">
            <h1 className="text-2xl font-light text-neutral-900 mb-2">Ha ocurrido un error</h1>
            <p className="text-neutral-600">Recarga la página o vuelve al inicio.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary

