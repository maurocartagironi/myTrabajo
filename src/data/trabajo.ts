// Mismo anotador de tareas laborales que vivía como panel dentro de MyFinanzas, ahora como su
// propia app independiente ("My Trabajo"). "hecho" queda sin usar en la UI (completar borra la
// tarea en vez de tildarla), pero se deja en el tipo para no forzar una migración de datos.
export interface TareaTrabajo {
  id: number;
  texto: string;
  hecho: boolean;
  empresa?: string;
  proyecto?: string;
  us?: string; // número de user story, ej. "SFCDB-429"
  // Uno o varios, fijos (ESTADOS_TRABAJO) o personalizados. Antes era un solo string; sigue
  // aceptándose así para no romper tareas viejas - ver estadosDe() en TrabajoApp.tsx para leerlo
  // siempre como lista.
  estado?: string | string[];
  horario?: string;
  dia?: string;
  diaFecha?: string; // "YYYY-MM-DD" real a la que apunta "dia" (ver migración de días en TrabajoApp.tsx)
  notas?: string; // ej. por qué está "En espera", se ve con un ícono al lado del nombre
  esBug?: boolean; // se muestra como un pill "BUG" al lado del título
}

export interface TrabajoData {
  tareas: TareaTrabajo[];
  coloresProyecto: Record<string, string>; // color elegido a mano por nombre de proyecto
  coloresEstado: Record<string, string>; // color elegido a mano por nombre de estado personalizado
}

export const trabajoDefault: TrabajoData = {
  tareas: [],
  coloresProyecto: {},
  coloresEstado: {},
};
