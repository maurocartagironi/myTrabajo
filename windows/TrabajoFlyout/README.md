# TrabajoFlyout

App de bandeja de Windows para My Trabajo, hermana de MusicFlyout / WhatsFlyout:

- Ícono en la bandeja con un globito rojo con la cantidad de tareas del día (las que se ven en
  el grupo del día al agrupar por día: sin backlog, sin "Pendientes" y sin "Hecho"; después de
  las 21 h cuenta las de mañana, igual que la web).
- Clic izquierdo: abre/cierra un panel abajo a la derecha con https://mytrabajo-mdc.web.app
  adentro (WebView2). Se cierra solo al hacer clic afuera.
- Clic derecho: Abrir · Abrir en el navegador · Recargar · Iniciar con Windows · Salir.

La página queda cargada en segundo plano escuchando Firestore en tiempo real, así que el número
se actualiza solo cuando cambiás algo desde el celu o desde otra pestaña.

## Cómo funciona el contador

La web detecta que corre adentro de WebView2 (`window.chrome.webview`) y le manda
`{ type: "count", count }` al host cada vez que cambian las tareas y una vez por minuto
(`src/services/widgetBridge.ts`). Sin sesión manda `{ type: "signedOut" }` y el ícono se pone gris.

**Hace falta deployar la web** (`npm run build` + `firebase deploy --only hosting`) para que
la página empiece a mandar el contador.

## Compilar y correr

Requiere el SDK de .NET 8 y el WebView2 Runtime (viene con Windows 11).

```powershell
cd windows\TrabajoFlyout
dotnet run
```

Para un .exe suelto:

```powershell
dotnet publish -c Release -r win-x64 --self-contained false -o publish
.\publish\TrabajoFlyout.exe
```

La primera vez abrí el panel y entrá con Google (se abre una ventanita de login). La sesión
queda guardada en `%LOCALAPPDATA%\TrabajoFlyout\WebView2`.
