import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface Props {
  title: string;
  onClose: () => void;
  onSave: () => void | Promise<void>;
  saveLabel?: string;
  danger?: boolean;
  children: ReactNode;
}

export default function Modal({ title, onClose, onSave, saveLabel = 'Guardar', danger = false, children }: Props) {
  const [saving, setSaving] = useState(false);
  useBodyScrollLock(true);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
    } catch (e) {
      console.error('Error al guardar:', e);
      window.alert('No se pudo guardar. Revisá tu conexión e intentá de nuevo.');
    }
    setSaving(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) handleSave();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onSave]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl w-[calc(100vw-24px)] sm:w-full sm:max-w-md shadow-2xl">
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-[var(--text-primary)] font-semibold text-base">{title}</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60
              ${danger
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
          >
            {saving ? 'Guardando...' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="block text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = 'w-full bg-[var(--bg-surface-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={inputClass} />;
}
