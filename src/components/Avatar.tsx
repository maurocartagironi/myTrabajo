import { useEffect, useState } from 'react';

// Foto de perfil (la de Google), o la inicial del email si no hay o si la URL no carga.
export default function Avatar({ photoURL, email, size = 28 }: { photoURL?: string | null; email?: string | null; size?: number }) {
  const [errored, setErrored] = useState(false);
  useEffect(() => setErrored(false), [photoURL]);

  if (photoURL && !errored) {
    return (
      <img
        src={photoURL}
        alt=""
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setErrored(true)}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 font-bold shrink-0"
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.4) }}
    >
      {(email ?? '?')[0].toUpperCase()}
    </div>
  );
}
