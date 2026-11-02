import { useState } from 'react';
import { Briefcase, LogOut, Sun, Moon, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';

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

  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-6 h-16 bg-[var(--bg-surface)] border-b border-[var(--border)] sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <Briefcase size={20} className="text-emerald-400" />
        <span className="font-bold text-[var(--text-primary)] text-lg">My Trabajo</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors" aria-label="Cambiar tema">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <UserMenu email={user?.email} photoURL={user?.photoURL} onSignOut={signOutUser} />
      </div>
    </header>
  );
}
