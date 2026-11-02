import { type ReactNode } from 'react';
import { Briefcase, ListChecks, Clock, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.8741 2.6836-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.5405-1.8368.8591-3.0477.8591-2.3441 0-4.3282-1.5831-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71c-.18-.5405-.2822-1.1177-.2822-1.71s.1023-1.1695.2823-1.71V4.9582H.9573A8.9965 8.9965 0 000 9c0 1.4523.3477 2.8268.9573 4.0418L3.964 10.71z" />
      <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1627 6.6559 3.5795 9 3.5795z" />
    </svg>
  );
}

const FEATURES = [
  { icon: ListChecks, label: 'Tareas por proyecto' },
  { icon: Clock,       label: 'Días y horarios' },
  { icon: Building2,   label: 'Empresas y US' },
];

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#0b0d13] flex items-center justify-center p-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="animate-aurora-1 absolute -top-32 -left-24 w-[560px] h-[560px] rounded-full bg-emerald-500/25 blur-[130px]" />
        <div className="animate-aurora-2 absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[140px]" />
        <div className="animate-aurora-3 absolute top-1/3 right-1/4 w-[420px] h-[420px] rounded-full bg-violet-500/15 blur-[120px]" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 100%)',
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_45%,transparent_0%,#0b0d13_85%)]" />

      <div className="relative w-full max-w-sm bg-[#141824]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 px-8 py-10 flex flex-col items-center text-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Briefcase size={22} className="text-emerald-400" />
          </div>
          <span className="font-bold text-white text-2xl tracking-tight">My Trabajo</span>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { loading, user, signIn } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-700 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Shell>
        <div>
          <p className="text-white font-semibold">Tus tareas de trabajo, en un solo lugar</p>
          <p className="text-slate-500 text-sm mt-1.5 max-w-xs">
            Ingresá con tu cuenta de Google para acceder a tus tareas, siempre sincronizadas y privadas.
          </p>
        </div>

        <div className="flex items-center gap-4 py-1">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 w-20">
              <div className="w-9 h-9 rounded-lg bg-[#1a1d27] border border-[#2d3250] flex items-center justify-center">
                <Icon size={16} className="text-slate-400" />
              </div>
              <span className="text-[10px] text-slate-600 leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => signIn()}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white hover:bg-slate-100 text-[#1f1f1f] rounded-xl text-sm font-medium shadow-lg shadow-black/20 transition-colors"
        >
          <GoogleIcon />
          Continuar con Google
        </button>

        <p className="text-[11px] text-slate-700">Tus datos son privados: nadie más puede verlos</p>
      </Shell>
    );
  }

  return <>{children}</>;
}
