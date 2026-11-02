import type { TrabajoData } from '../data/trabajo';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión activa');
  return uid;
}

const dataDocRef = () => doc(db, 'users', requireUid(), 'trabajo', 'data');
const backupsCol = () => collection(db, 'users', requireUid(), 'trabajo', 'data', 'backups');

export async function fetchData(): Promise<TrabajoData> {
  const snap = await getDoc(dataDocRef());
  return (snap.exists() ? snap.data() : {}) as TrabajoData;
}

// Firestore tira un error y no guarda NADA si cualquier campo, en cualquier nivel, tiene el
// valor literal undefined - se saca acá para cualquier campo opcional, para no quedarse sin
// guardar en silencio por un campo vacío en una tarea.
function sinUndefined<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function saveData(data: TrabajoData): Promise<void> {
  const limpio = sinUndefined(data);
  await setDoc(dataDocRef(), limpio);

  // Backup con timestamp (últimos 30), mismo patrón que MyFinanzas - si esto falla no debe
  // tirar abajo el guardado principal, que ya se completó arriba.
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await setDoc(doc(backupsCol(), stamp), limpio);
    const snaps = await getDocs(backupsCol());
    const ids = snaps.docs.map(d => d.id).sort();
    if (ids.length > 30) {
      const aBorrar = ids.slice(0, ids.length - 30);
      await Promise.all(aBorrar.map(id => deleteDoc(doc(backupsCol(), id))));
    }
  } catch (e) {
    console.error('No se pudo guardar el backup', e);
  }
}

export function nextId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}
