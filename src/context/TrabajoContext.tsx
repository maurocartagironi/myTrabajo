import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { trabajoDefault, type TrabajoData } from '../data/trabajo';
import { fetchData, saveData } from '../services/api';

interface TrabajoContextType {
  data: TrabajoData;
  loading: boolean;
  serverOk: boolean;
  saving: boolean;
  updateData: (patch: Partial<TrabajoData>) => Promise<void>;
}

const Ctx = createContext<TrabajoContextType | null>(null);

export function TrabajoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<TrabajoData>(trabajoDefault);
  const [loading, setLoading] = useState(true);
  const [serverOk, setServerOk] = useState(false);
  const [savingCount, setSavingCount] = useState(0);
  const saving = savingCount > 0;

  useEffect(() => {
    fetchData()
      .then(d => {
        setData({ ...trabajoDefault, ...d });
        setServerOk(true);
      })
      .catch(() => setServerOk(false))
      .finally(() => setLoading(false));
  }, []);

  const updateData = useCallback(async (patch: Partial<TrabajoData>) => {
    const final = { ...data, ...patch };
    setData(final);
    if (serverOk) {
      setSavingCount(c => c + 1);
      try {
        await saveData(final);
      } finally {
        setSavingCount(c => c - 1);
      }
    }
  }, [data, serverOk]);

  return (
    <Ctx.Provider value={{ data, loading, serverOk, saving, updateData }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTrabajo() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTrabajo debe usarse dentro de TrabajoProvider');
  return ctx;
}
