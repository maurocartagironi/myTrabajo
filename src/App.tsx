import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TrabajoProvider, useTrabajo } from './context/TrabajoContext';
import AuthGate from './components/AuthGate';
import SavingIndicator from './components/SavingIndicator';
import Header from './components/Header';
import TrabajoApp from './components/TrabajoApp';
import ImportarMyFinanzas from './components/ImportarMyFinanzas';
import { ServerCrash } from 'lucide-react';

function ServerOffline() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-app)] gap-4 p-6 text-center">
      <ServerCrash size={48} className="text-red-400" />
      <h1 className="text-[var(--text-primary)] text-2xl font-bold">No se pudo conectar</h1>
      <p className="text-[var(--text-secondary)] max-w-sm">
        No se pudieron cargar tus datos. Revisá tu conexión a internet y volvé a intentar.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
}

function AppInner() {
  const { loading, serverOk } = useTrabajo();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }
  if (!serverOk) return <ServerOffline />;

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <SavingIndicator />
      <Header />
      <ImportarMyFinanzas />
      <TrabajoApp />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <TrabajoProvider>
            <AppInner />
          </TrabajoProvider>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
