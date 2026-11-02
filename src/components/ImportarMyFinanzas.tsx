import { useState } from 'react';
import { Download } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useTrabajo } from '../context/TrabajoContext';
import type { TareaTrabajo } from '../data/trabajo';

// Config de la app vieja, para poder leer "trabajo"/"trabajoColores" de ahí una sola vez y
// traerlos acá. Se usa como una segunda app de Firebase aparte (named app "myfinanzas"), con su
// propio login: la persona inicia sesión en ESE proyecto con su cuenta de Google (la misma
// cuenta, pero es un login aparte porque es un proyecto de Firebase distinto) y de ahí se lee su
// propio documento, con las mismas reglas de seguridad de siempre (solo puede leer el suyo).
const MYFINANZAS_CONFIG = {
  apiKey: import.meta.env.VITE_MYFINANZAS_API_KEY,
  authDomain: import.meta.env.VITE_MYFINANZAS_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_MYFINANZAS_PROJECT_ID,
};

// Componente temporal: se borra del proyecto una vez hecha la migración de una sola vez.
export default function ImportarMyFinanzas() {
  const { data, updateData } = useTrabajo();
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'ok' | 'error'>('idle');
  const [mensaje, setMensaje] = useState('');

  if (data.tareas.length > 0) return null; // ya hay tareas: no tiene sentido ofrecer importar

  const importar = async () => {
    setEstado('cargando');
    try {
      const app = initializeApp(MYFINANZAS_CONFIG, 'myfinanzas');
      const auth = getAuth(app);
      const db = getFirestore(app);
      const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
      const snap = await getDoc(doc(db, 'users', user.uid, 'finanzas', 'data'));
      if (!snap.exists()) {
        setEstado('error');
        setMensaje('No se encontraron datos en MyFinanzas para esta cuenta.');
        return;
      }
      const raw = snap.data() as { trabajo?: TareaTrabajo[]; trabajoColores?: Record<string, string> };
      const tareas = raw.trabajo ?? [];
      if (tareas.length === 0) {
        setEstado('error');
        setMensaje('MyFinanzas no tiene tareas cargadas en Trabajo.');
        return;
      }
      await updateData({ tareas, coloresProyecto: raw.trabajoColores ?? {} });
      setEstado('ok');
      setMensaje(`Se importaron ${tareas.length} tareas.`);
    } catch (e) {
      console.error(e);
      setEstado('error');
      setMensaje('No se pudo importar. Probá de nuevo.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-4">
      <div className="flex items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm text-[var(--text-primary)] font-medium">Traer tareas de MyFinanzas</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {estado === 'ok' || estado === 'error' ? mensaje : 'Importa una sola vez las tareas que tenías en el panel de Trabajo'}
          </p>
        </div>
        {estado !== 'ok' && (
          <button
            onClick={importar}
            disabled={estado === 'cargando'}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/15 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download size={14} /> {estado === 'cargando' ? 'Importando...' : 'Importar'}
          </button>
        )}
      </div>
    </div>
  );
}
