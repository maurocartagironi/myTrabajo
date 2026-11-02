import { useState } from 'react';
import { Briefcase, LogOut, Sun, Moon, ChevronDown, Settings, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, type FontSize } from '../context/ThemeContext';
import Avatar from './Avatar';

const TAMANOS: { value: FontSize; label: string }[] = [
  { value: 'small',  label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large',  label: 'Large' },
  { value: 'xlarge', label: 'Extra grande' },
];

function ConfiguracionModal({ onClose }: { onClose: () => void }) {
  const { fontSize, setFontSize } = useTheme();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-[var(--text-primary)] font-semibold text-base">Configuración</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Tamaño de letra</label>
          <div className="grid grid-cols-2 gap-2">
            {TAMANOS.map(t => (
              <button
                key={t.value}
                onClick={() => setFontSize(t.value)}
                className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                  fontSize === t.value
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {t.label}
                {fontSize === t.value && <Check size={14} />}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">Se aplica al toque, para que vayas viendo cuál te gusta más.</p>
        </div>
      </div>
    </div>
  );
}

function UserMenu({ email, photoURL, onSignOut }: { email?: string | null; photoURL?: string | null; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" title={email ?? ''}>
        <Avatar photoURL={photoURL} email={email} />
        <ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 w-48 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
            <div className="px-3 py-2.5 border-b border-[var(--border)]">
              <p className="text-xs text-[var(--text-tertiary)] truncate">{email}</p>
            </div>
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-[var(--bg-surface-hover)] transition-colors text-left"
            >
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Header único (esta app tiene una sola pantalla, no hace falta un nav de páginas).
export default function Header() {
  const { user, signOutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [configOpen, setConfigOpen] = useState(false);

  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-6 h-16 bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <Briefcase size={20} className="text-emerald-400" />
        <span className="font-bold text-[var(--text-primary)] text-lg">My Trabajo</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setConfigOpen(true)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="Configuración">
          <Settings size={18} />
        </button>
        <button onClick={toggleTheme} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="Cambiar tema">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <UserMenu email={user?.email} photoURL={user?.photoURL} onSignOut={signOutUser} />
      </div>
      {configOpen && <ConfiguracionModal onClose={() => setConfigOpen(false)} />}
    </header>
  );
}
