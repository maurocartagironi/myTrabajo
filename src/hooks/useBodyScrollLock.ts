import { useEffect } from 'react';

// Bloquea el scroll del fondo mientras hay un overlay (modal, popup) abierto. Cada instancia
// guarda el valor de "overflow" que había antes de activarse y lo restaura al desactivarse, así
// se banca overlays anidados.
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [active]);
}
