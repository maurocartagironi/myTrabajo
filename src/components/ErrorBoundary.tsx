import { Component, type ReactNode } from 'react';

interface State { error: Error | null; }

// Sin esto, cualquier error de render tira abajo TODO el árbol de React y deja una pantalla en
// blanco sin ningún mensaje. Con esto, al menos se ve el error y se puede reintentar.
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error no manejado en la app', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center p-6">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Algo salió mal</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Hubo un error inesperado. Probá recargar la página.
            </p>
            <pre className="text-xs text-left bg-[var(--bg-surface-hover)] border border-[var(--border)] rounded-lg p-3 overflow-auto text-red-400 whitespace-pre-wrap">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
