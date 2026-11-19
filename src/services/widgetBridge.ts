import { useEffect } from 'react';
import type { TareaTrabajo } from '../data/trabajo';

// Puente con TrabajoFlyout (la app de bandeja de Windows, ver /windows/TrabajoFlyout): cuando la
// página corre adentro de su WebView2, existe window.chrome.webview y se le manda el contador de
// tareas del día para que lo dibuje en el ícono. En un navegador normal no hace nada.

interface WebViewHost {
  postMessage: (msg: unknown) => void;
}

function host(): WebViewHost | undefined {
  return (window as unknown as { chrome?: { webview?: WebViewHost } }).chrome?.webview;
}

export const esWidget = (): boolean => host() !== undefined;

export function avisarAlWidget(msg: { type: 'count'; count: number } | { type: 'signedOut' }) {
  try {
    host()?.postMessage(msg);
  } catch {
    // Si el host no está listo no pasa nada: el próximo cambio lo vuelve a mandar.
  }
}

// Mismo criterio que TrabajoApp para el grupo "de hoy" al agrupar por día: después de las 21h
// ya cuenta las de mañana (diaPorDefecto), que es el primer grupo que se ve en la lista.
const DIAS_JS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
function diaPorDefecto(): string {
  const ahora = new Date();
  let idx = ahora.getDay();
  if (ahora.getHours() >= 21) idx = (idx + 1) % 7;
  return DIAS_JS[idx];
}

function estadosDe(it: { estado?: string | string[] }): string[] {
  if (Array.isArray(it.estado)) return it.estado.filter(Boolean);
  return it.estado ? [it.estado] : [];
}

// Tareas del día que se ven en la lista: sin backlog (esas solo suman al pill), sin las que van
// arriba en "Pendientes" y sin las ya marcadas como "Hecho".
export function contarTareasDelDia(tareas: TareaTrabajo[]): number {
  const dia = diaPorDefecto();
  return tareas.filter(t => {
    if (t.esBacklog) return false;
    const estados = estadosDe(t);
    if (estados.includes('Pendiente') || estados.includes('Hecho')) return false;
    return (t.dia || dia) === dia;
  }).length;
}

// Manda el contador cada vez que cambian las tareas y una vez por minuto (por si cambia el día
// o pasan las 21h con la ventana abierta sin tocar nada).
export function useWidgetBridge(tareas: TareaTrabajo[], listo: boolean) {
  useEffect(() => {
    if (!listo || !esWidget()) return;
    const enviar = () => avisarAlWidget({ type: 'count', count: contarTareasDelDia(tareas) });
    enviar();
    const id = setInterval(enviar, 60_000);
    return () => clearInterval(id);
  }, [tareas, listo]);
}
