import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Pencil, Trash2, Check, ChevronDown, ChevronRight, Plus, Sun, Sunset, Moon } from 'lucide-react';
import { useTrabajo } from '../context/TrabajoContext';
import type { TareaTrabajo } from '../data/trabajo';
import { nextId } from '../services/api';
import Modal, { Field, TextInput } from './Modal';

const smallInputClass = 'w-full bg-[var(--bg-surface-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors';
const textareaClass = 'w-full bg-[var(--bg-surface-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-y';

function applyReorder<T extends { id: number }>(all: T[], reordered: T[]): T[] {
  const ids = new Set(reordered.map(i => i.id));
  let idx = 0;
  return all.map(item => (ids.has(item.id) ? reordered[idx++] : item));
}

function CollapsibleGroup({ title, items, coloresProyecto, children }: {
  title: string;
  items: TareaTrabajo[];
  coloresProyecto: Record<string, string>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const porProyecto = (() => {
    const map = new Map<string, number>();
    items.forEach(it => { if (it.proyecto) map.set(it.proyecto, (map.get(it.proyecto) ?? 0) + 1); });
    return [...map.entries()];
  })();
  return (
    <div className="pt-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-2 hover:text-[var(--text-primary)] transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {title}
        {!open && porProyecto.length > 0 && (
          <span className="flex items-center gap-1 normal-case tracking-normal font-normal">
            {porProyecto.map(([p, count]) => {
              const color = colorDeProyecto(p, coloresProyecto);
              return (
                <span
                  key={p}
                  className="text-[0.625rem] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${color}33`, color }}
                  title={p}
                >
                  {count}
                </span>
              );
            })}
          </span>
        )}
      </button>
      {open && children}
    </div>
  );
}

function CampoInput({ value, onChange, opciones, datalistId, placeholder }: {
  value: string; onChange: (v: string) => void; opciones: string[]; datalistId: string; placeholder: string;
}) {
  return (
    <>
      <input value={value} onChange={e => onChange(e.target.value)} list={datalistId} placeholder={placeholder} className={smallInputClass} />
      <datalist id={datalistId}>
        {opciones.map(o => <option key={o} value={o} />)}
      </datalist>
    </>
  );
}

const ESTADOS_TRABAJO: { value: string; className: string }[] = [
  { value: 'Pendiente', className: 'text-[var(--text-tertiary)] bg-[var(--bg-surface-hover)] border-[var(--border)]' },
  { value: 'En espera', className: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  { value: 'En desarrollo', className: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  { value: 'Listo para pasar', className: 'text-violet-400 bg-violet-500/10 border-violet-500/30' },
  { value: 'Bloqueado', className: 'text-red-400 bg-red-500/10 border-red-500/30' },
  { value: 'Hecho', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
];
const ORDEN_DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const ICONO_HORARIO: Record<string, typeof Sun> = { 'Mañana': Sun, 'Tarde': Sunset, 'Noche': Moon };
function horarioBadgeLineas(h: string): [string] | [string, string] {
  const reloj = h.match(/^(\d{1,2}):(\d{2})$/);
  if (reloj) return [reloj[1], reloj[2]];
  return [h];
}

function diaPorDefecto(): string {
  const DIAS_JS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const ahora = new Date();
  let idx = ahora.getDay();
  if (ahora.getHours() >= 21) idx = (idx + 1) % 7;
  return DIAS_JS[idx];
}

const PROYECTO_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
function colorHashDeProyecto(nombre: string): string {
  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = (hash * 31 + nombre.charCodeAt(i)) >>> 0;
  return PROYECTO_COLORS[hash % PROYECTO_COLORS.length];
}
function colorDeProyecto(nombre: string | undefined, colores: Record<string, string>): string | undefined {
  if (!nombre) return undefined;
  return colores[nombre] ?? colorHashDeProyecto(nombre);
}

function groupByField<T>(items: T[], campo: (item: T) => string | undefined, orden?: string[]) {
  const sueltos = items.filter(i => !campo(i));
  let valores = [...new Set(items.map(campo).filter((v): v is string => !!v))];
  if (orden) valores = [...orden.filter(v => valores.includes(v)), ...valores.filter(v => !orden.includes(v))];
  return { sueltos, valores, de: (v: string) => items.filter(i => campo(i) === v) };
}

function TrabajoRows({ items, onEdit, onDelete, onReorder, ocultarCampo, coloresProyecto }: {
  items: TareaTrabajo[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onReorder: (items: TareaTrabajo[]) => void;
  ocultarCampo?: 'proyecto' | 'estado' | 'horario' | 'dia';
  coloresProyecto: Record<string, string>;
}) {
  const completar = (id: number, texto: string) => {
    if (window.confirm(`¿Marcar "${texto}" como completada? Se borra de la lista.`)) onDelete(id);
  };
  // Mueve la tarea un lugar hacia arriba/abajo dentro del grupo. El orden se muestra tal cual
  // está guardado (ya no se reordena solo por horario), así que esto mueve la fila de verdad.
  const mover = (id: number, dir: -1 | 1) => {
    const idx = items.findIndex(i => i.id === id);
    const destino = idx + dir;
    if (idx === -1 || destino < 0 || destino >= items.length) return;
    const next = [...items];
    [next[idx], next[destino]] = [next[destino], next[idx]];
    onReorder(next);
  };

  // El menú de acciones (completar/editar/borrar/mover) se abre haciendo click en la fila, en
  // vez de aparecer solo al pasar el mouse - así funciona igual en touch que con mouse.
  const [menuAbiertoId, setMenuAbiertoId] = useState<number | null>(null);
  useEffect(() => {
    if (menuAbiertoId == null) return;
    const onClickOutside = (e: MouseEvent) => {
      const rowEl = (e.target as HTMLElement).closest('[data-row-id]');
      if (!rowEl || Number(rowEl.getAttribute('data-row-id')) !== menuAbiertoId) setMenuAbiertoId(null);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuAbiertoId]);

  return (
    <div>
      {items.map(it => {
        const colorProy = colorDeProyecto(it.proyecto, coloresProyecto);
        const estadoInfo = ESTADOS_TRABAJO.find(e => e.value === it.estado);

        // Línea compacta tipo bullet: [Horario] - [Empresa] [Proyecto] - [Texto], con el estado
        // como pill al final y, si hay nota, una segunda línea más chica debajo.
        const empresaProyecto = (it.empresa || it.proyecto)
          ? <>
              {it.empresa && <span className="font-bold text-[var(--text-primary)]">{it.empresa}</span>}
              {it.empresa && it.proyecto && ' '}
              {it.proyecto && <span className="font-bold" style={{ color: colorProy }}>{it.proyecto}</span>}
            </>
          : null;
        const segmentos = [
          empresaProyecto,
          <span className="text-[var(--text-secondary)]">
            {it.us && <span className="font-bold">{it.us}</span>}
            {it.us ? ' - ' : ''}{it.texto}
          </span>,
          it.dia && ocultarCampo !== 'dia' ? <span className="text-[var(--text-tertiary)]">{it.dia}</span> : null,
        ].filter(Boolean);

        return (
          <div
            key={it.id}
            data-row-id={it.id}
            onClick={() => setMenuAbiertoId(id => (id === it.id ? null : it.id))}
            className="relative flex items-center gap-1.5 px-1 -mx-1 py-0.5 rounded cursor-pointer hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <span
              className={`shrink-0 w-6 h-6 rounded flex flex-col items-center justify-center font-bold overflow-hidden ${
                it.horario && ocultarCampo !== 'horario' ? 'border border-[var(--border)] bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]' : ''
              }`}
              title={it.horario}
            >
              {it.horario && ocultarCampo !== 'horario' && (
                ICONO_HORARIO[it.horario]
                  ? (() => { const Icono = ICONO_HORARIO[it.horario]; return <Icono size={13} />; })()
                  : horarioBadgeLineas(it.horario).map((linea, i, arr) => (
                      <span key={i} className={arr.length === 2 ? 'text-[0.5625rem] leading-[0.5625rem]' : 'text-xs leading-none'}>{linea}</span>
                    ))
              )}
            </span>
            <div className="flex-1 min-w-0">
              <p className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-[0.8125rem] leading-5">
                <span className="min-w-0">
                  {segmentos.map((seg, i) => (
                    <span key={i}>
                      {i > 0 && <span className="text-[var(--text-tertiary)] px-1">·</span>}
                      {seg}
                    </span>
                  ))}
                </span>
                {estadoInfo && ocultarCampo !== 'estado' && (
                  <span className={`shrink-0 text-[0.5rem] font-bold uppercase leading-none px-1 py-0.5 rounded-full border ${estadoInfo.className}`}>
                    {estadoInfo.value}
                  </span>
                )}
              </p>
              {it.notas && <p className="text-[0.6875rem] text-[var(--text-tertiary)] leading-tight">{it.notas}</p>}
            </div>
            {menuAbiertoId === it.id && (
              <div
                onClick={e => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-20 w-40 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden cursor-default"
              >
                <button
                  onClick={() => { completar(it.id, it.texto); setMenuAbiertoId(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Check size={13} className="text-emerald-400" /> Marcar completada
                </button>
                <button
                  onClick={() => { onEdit(it.id); setMenuAbiertoId(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Pencil size={13} /> Editar
                </button>
                <button
                  onClick={() => { onDelete(it.id); setMenuAbiertoId(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <Trash2 size={13} /> Borrar
                </button>
                <button
                  onClick={() => { mover(it.id, -1); setMenuAbiertoId(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <ArrowUp size={13} /> Subir
                </button>
                <button
                  onClick={() => { mover(it.id, 1); setMenuAbiertoId(null); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
                >
                  <ArrowDown size={13} /> Bajar
                </button>
              </div>
            )}
          </div>
        );
      })}
      {items.length === 0 && <p className="text-xs text-[var(--text-tertiary)] text-center py-2">Sin tareas.</p>}
    </div>
  );
}

// Página principal: el mismo anotador de tareas laborales que antes vivía como panel dentro de
// MyFinanzas, ahora como el contenido único de su propia app.
export default function TrabajoApp() {
  const { data, updateData } = useTrabajo();
  const items = data.tareas;
  const onChange = (next: TareaTrabajo[]) => updateData({ tareas: next });
  const coloresProyecto = data.coloresProyecto;
  const setColorProyecto = (proyecto: string, color: string) => updateData({ coloresProyecto: { ...coloresProyecto, [proyecto]: color } });

  const [agruparPor, setAgruparPor] = useState<'dia' | 'proyecto' | 'estado' | 'horario' | 'ninguno'>('dia');
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; id: number } | null>(null);
  const [form, setForm] = useState({ texto: '', proyecto: '', empresa: '', us: '', estado: '', horario: '', dia: '', notas: '' });
  const [colorEnEleccion, setColorEnEleccion] = useState<string | null>(null);

  const openAdd = () => { setForm({ texto: '', proyecto: '', empresa: '', us: '', estado: '', horario: '', dia: '', notas: '' }); setModal({ mode: 'add' }); };
  const openEdit = (id: number) => {
    const it = items.find(i => i.id === id);
    if (!it) return;
    setForm({ texto: it.texto, proyecto: it.proyecto ?? '', empresa: it.empresa ?? '', us: it.us ?? '', estado: it.estado ?? '', horario: it.horario ?? '', dia: it.dia ?? '', notas: it.notas ?? '' });
    setModal({ mode: 'edit', id });
  };
  const save = async () => {
    if (!form.texto.trim()) return;
    const campos = {
      texto: form.texto.trim(),
      proyecto: form.proyecto.trim() || undefined,
      empresa: form.empresa.trim() || undefined,
      us: form.us.trim() || undefined,
      estado: form.estado || undefined,
      horario: form.horario.trim() || undefined,
      dia: form.dia.trim() || undefined,
      notas: form.notas.trim() || undefined,
    };
    if (modal?.mode === 'edit') {
      await onChange(items.map(i => i.id === modal.id ? { ...i, ...campos } : i));
    } else {
      await onChange([...items, { id: nextId(), hecho: false, ...campos }]);
    }
    setModal(null);
  };
  const del = (id: number) => onChange(items.filter(i => i.id !== id));

  const valoresDe = (campo: (i: TareaTrabajo) => string | undefined) => [...new Set(items.map(campo).filter((v): v is string => !!v))];
  const proyectos = valoresDe(i => i.proyecto);
  const empresas = valoresDe(i => i.empresa);
  const horarios = valoresDe(i => i.horario);
  const dias = valoresDe(i => i.dia);

  const pendientes = items.filter(i => i.estado === 'Pendiente');
  const resto = items.filter(i => i.estado !== 'Pendiente');

  const campoActivo = (it: TareaTrabajo) =>
    agruparPor === 'dia' ? (it.dia || diaPorDefecto()) : agruparPor === 'proyecto' ? it.proyecto : agruparPor === 'estado' ? it.estado : agruparPor === 'horario' ? it.horario : undefined;
  const groups = agruparPor === 'ninguno' ? null : groupByField(resto, campoActivo, agruparPor === 'dia' ? ORDEN_DIAS : undefined);
  const rowsProps = (lista: TareaTrabajo[]) => ({
    items: lista,
    onEdit: openEdit,
    onDelete: del,
    onReorder: (reordered: TareaTrabajo[]) => onChange(applyReorder(items, reordered)),
    ocultarCampo: agruparPor === 'ninguno' ? undefined : agruparPor,
    coloresProyecto,
  });

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Tareas</h1>
        <button onClick={openAdd} className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors">
          <Plus size={16} /> Nueva
        </button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap mb-3">
        <span className="text-xs text-[var(--text-tertiary)] mr-1">Agrupar por:</span>
        {([['dia', 'Día'], ['proyecto', 'Proyecto'], ['estado', 'Estado'], ['horario', 'Horario'], ['ninguno', 'Sin agrupar']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setAgruparPor(v)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${agruparPor === v ? 'bg-emerald-500/15 text-emerald-400' : 'text-[var(--text-secondary)] bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {pendientes.length > 0 && (
        <CollapsibleGroup title="Pendientes" items={pendientes} coloresProyecto={coloresProyecto}>
          <TrabajoRows {...rowsProps(pendientes)} ocultarCampo="estado" />
        </CollapsibleGroup>
      )}
      {groups === null ? (
        <TrabajoRows {...rowsProps(resto)} />
      ) : (
        <>
          {groups.sueltos.length > 0 && <TrabajoRows {...rowsProps(groups.sueltos)} />}
          {groups.valores.map(v => (
            <CollapsibleGroup key={v} title={v} items={groups.de(v)} coloresProyecto={coloresProyecto}>
              <TrabajoRows {...rowsProps(groups.de(v))} />
            </CollapsibleGroup>
          ))}
        </>
      )}
      {items.length === 0 && <p className="text-sm text-[var(--text-tertiary)] text-center py-8">Sin tareas cargadas todavía.</p>}

      {modal && (
        <Modal title={modal.mode === 'add' ? 'Nueva tarea' : 'Editar tarea'} onClose={() => setModal(null)} onSave={save}>
          <Field label="Tarea">
            <TextInput value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Empresa (opcional)">
              <CampoInput value={form.empresa} onChange={c => setForm(f => ({ ...f, empresa: c }))} opciones={empresas} datalistId="trabajo-empresas" placeholder="Empresa" />
            </Field>
            <Field label="Proyecto (opcional)">
              <CampoInput value={form.proyecto} onChange={c => setForm(f => ({ ...f, proyecto: c }))} opciones={proyectos} datalistId="trabajo-proyectos" placeholder="Proyecto" />
            </Field>
          </div>
          {form.proyecto.trim() && (
            <Field label={`Color de "${form.proyecto.trim()}"`}>
              <div className="flex flex-wrap items-center gap-2">
                {PROYECTO_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColorProyecto(form.proyecto.trim(), c)}
                    aria-label={c}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full shrink-0 ${colorDeProyecto(form.proyecto.trim(), coloresProyecto) === c ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-surface)] ring-emerald-400' : ''}`}
                  />
                ))}
                <label className="relative w-6 h-6 rounded-full shrink-0 overflow-hidden cursor-pointer" style={{ background: 'conic-gradient(from 0deg, #ef4444, #facc15, #10b981, #3b82f6, #a855f7, #ef4444)' }}>
                  <input
                    type="color"
                    value={colorEnEleccion ?? colorDeProyecto(form.proyecto.trim(), coloresProyecto)}
                    onChange={e => setColorEnEleccion(e.target.value)}
                    onBlur={() => {
                      if (colorEnEleccion) setColorProyecto(form.proyecto.trim(), colorEnEleccion);
                      setColorEnEleccion(null);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </label>
              </div>
            </Field>
          )}
          <Field label="N° de US (opcional)">
            <TextInput value={form.us} onChange={e => setForm(f => ({ ...f, us: e.target.value }))} />
          </Field>
          <Field label="Estado (opcional)">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, estado: '' }))}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.estado === '' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
              >
                Sin estado
              </button>
              {ESTADOS_TRABAJO.map(e => (
                <button
                  type="button"
                  key={e.value}
                  onClick={() => setForm(f => ({ ...f, estado: e.value }))}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.estado === e.value ? e.className : 'border-[var(--border)] text-[var(--text-secondary)]'}`}
                >
                  {e.value}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Horario (opcional)">
              <CampoInput value={form.horario} onChange={c => setForm(f => ({ ...f, horario: c }))} opciones={horarios} datalistId="trabajo-horarios" placeholder="Horario" />
            </Field>
            <Field label="Día (opcional)">
              <CampoInput value={form.dia} onChange={c => setForm(f => ({ ...f, dia: c }))} opciones={[...ORDEN_DIAS, ...dias.filter(d => !ORDEN_DIAS.includes(d))]} datalistId="trabajo-dias" placeholder="Día" />
            </Field>
          </div>
          <Field label="Notas (opcional, ej. por qué está en espera)">
            <textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} className={textareaClass} />
          </Field>
        </Modal>
      )}
    </div>
  );
}
