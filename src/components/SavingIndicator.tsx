import { useTrabajo } from '../context/TrabajoContext';

// Barra fina animada arriba de todo, visible mientras hay alguna operación en curso contra
// Firestore. El guardado local (setData) es instantáneo; esto refleja solo la escritura real.
export default function SavingIndicator() {
  const { saving } = useTrabajo();
  if (!saving) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] h-[3px] bg-[#1a1d27] overflow-hidden pointer-events-none">
      <div className="h-full w-1/3 bg-emerald-400 animate-saving-bar" />
    </div>
  );
}
