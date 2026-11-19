using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace TrabajoFlyout;

// Ventana sin bordes que aparece abajo a la derecha, arriba de la barra de tareas, con
// MyTrabajo adentro. Se crea al arrancar y queda oculta (la página sigue viva y escuchando
// Firestore en tiempo real), así el contador del ícono está siempre al día y al abrirla no hay
// que esperar a que cargue.
internal sealed class FlyoutForm : Form
{
    private const int AnchoDip = 460;
    private const int AltoDip = 720;
    private const int MargenDip = 12;
    private static readonly Color Fondo = Color.FromArgb(0x0f, 0x11, 0x17);

    private readonly string _url;
    private readonly WebView2 _web;
    private CoreWebView2Environment? _env;
    private DateTime _ocultadaEn = DateTime.MinValue;
    private bool _saliendo;
    private bool _popupAbierto;

    public event Action<int>? CountChanged;
    public event Action? SignedOut;

    public FlyoutForm(string url)
    {
        _url = url;
        Text = "My Trabajo";
        FormBorderStyle = FormBorderStyle.None;
        ShowInTaskbar = false;
        TopMost = true;
        StartPosition = FormStartPosition.Manual;
        BackColor = Fondo;
        Padding = new Padding(1); // borde fino de 1px, se pinta en OnPaint

        _web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = Fondo };
        Controls.Add(_web);

        Deactivate += (_, _) => { if (!_popupAbierto) HideFlyout(); };

        // Fuerza crear las ventanas ya (sin mostrarlas) para que WebView2 arranque oculto.
        _ = Handle;
        _ = _web.Handle;
        _ = InitAsync();
    }

    private async Task InitAsync()
    {
        try
        {
            var dataDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "TrabajoFlyout", "WebView2");
            _env = await CoreWebView2Environment.CreateAsync(null, dataDir);
            await _web.EnsureCoreWebView2Async(_env);

            var core = _web.CoreWebView2;
            core.Profile.PreferredColorScheme = CoreWebView2PreferredColorScheme.Dark;
            core.Settings.IsStatusBarEnabled = false;
            core.Settings.AreDevToolsEnabled = true; // F12 por si hay que depurar algo
            core.WebMessageReceived += OnWebMessage;
            core.NewWindowRequested += OnNewWindowRequested;
            core.Navigate(_url);
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "No se pudo iniciar WebView2. Instalá el \"Microsoft Edge WebView2 Runtime\" y volvé a abrir TrabajoFlyout.\n\n" + ex.Message,
                "TrabajoFlyout", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    // Mensajes que manda la página (src/services/widgetBridge.ts).
    private void OnWebMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        try
        {
            using var doc = JsonDocument.Parse(e.WebMessageAsJson);
            var root = doc.RootElement;
            switch (root.GetProperty("type").GetString())
            {
                case "count":
                    CountChanged?.Invoke(root.GetProperty("count").GetInt32());
                    break;
                case "signedOut":
                    SignedOut?.Invoke();
                    break;
            }
        }
        catch { /* mensaje con otro formato: se ignora */ }
    }

    // El login de Google (signInWithPopup) abre un popup: se muestra en una ventanita propia que
    // comparte sesión con el flyout. Cualquier otro link que abra ventana nueva va al navegador.
    private async void OnNewWindowRequested(object? sender, CoreWebView2NewWindowRequestedEventArgs e)
    {
        if (!EsDeLogin(e.Uri))
        {
            e.Handled = true;
            try { Process.Start(new ProcessStartInfo(e.Uri) { UseShellExecute = true }); } catch { }
            return;
        }

        var deferral = e.GetDeferral();
        try
        {
            _popupAbierto = true;
            var popup = new Form
            {
                Text = "Iniciar sesión - My Trabajo",
                StartPosition = FormStartPosition.CenterScreen,
                ClientSize = new Size(Escalar(500), Escalar(640)),
                BackColor = Fondo,
                TopMost = true,
            };
            var web = new WebView2 { Dock = DockStyle.Fill, DefaultBackgroundColor = Color.White };
            popup.Controls.Add(web);
            popup.FormClosed += (_, _) =>
            {
                _popupAbierto = false;
                web.Dispose();
                if (Visible) Activate(); // así vuelve a cerrarse sola al hacer clic afuera
            };
            popup.Show();
            await web.EnsureCoreWebView2Async(_env);
            web.CoreWebView2.WindowCloseRequested += (_, _) => popup.Close();
            e.NewWindow = web.CoreWebView2;
        }
        finally
        {
            deferral.Complete();
        }
    }

    private bool EsDeLogin(string uri)
    {
        if (uri.StartsWith("about:", StringComparison.OrdinalIgnoreCase)) return true;
        if (!Uri.TryCreate(uri, UriKind.Absolute, out var u)) return false;
        var host = u.Host.ToLowerInvariant();
        return host == new Uri(_url).Host
            || host.EndsWith(".firebaseapp.com")
            || host == "accounts.google.com";
    }

    public void ToggleFlyout()
    {
        if (Visible) { HideFlyout(); return; }
        // Al hacer clic en el ícono con el flyout abierto, primero se pierde el foco (Deactivate
        // lo oculta) y después llega el clic: sin esto se volvería a abrir enseguida.
        if ((DateTime.Now - _ocultadaEn).TotalMilliseconds < 300) return;
        ShowFlyout();
    }

    public void ShowFlyout()
    {
        var pantalla = Screen.FromPoint(Cursor.Position);
        var area = pantalla.WorkingArea;
        float escala = DpiDe(pantalla) / 96f;
        int ancho = (int)(AnchoDip * escala);
        int margen = (int)(MargenDip * escala);
        int alto = Math.Min((int)(AltoDip * escala), area.Height - margen * 2);

        // Abajo a la derecha del área de trabajo (pegado a la barra de tareas).
        Bounds = new Rectangle(area.Right - ancho - margen, area.Bottom - alto - margen, ancho, alto);
        Show();
        Activate();
        _web.Focus();
    }

    public void HideFlyout()
    {
        if (!Visible) return;
        Hide();
        _ocultadaEn = DateTime.Now;
    }

    public void Reload() => _web.CoreWebView2?.Reload();

    public void Quit()
    {
        _saliendo = true;
        Close();
    }

    protected override void OnFormClosing(FormClosingEventArgs e)
    {
        // Alt+F4 solo la oculta; se cierra de verdad desde "Salir" en el menú del ícono.
        if (!_saliendo && e.CloseReason == CloseReason.UserClosing)
        {
            e.Cancel = true;
            HideFlyout();
            return;
        }
        base.OnFormClosing(e);
    }

    protected override void OnHandleCreated(EventArgs e)
    {
        base.OnHandleCreated(e);
        // Esquinas redondeadas de Windows 11 (en Windows 10 se ignora).
        int pref = 2; // DWMWCP_ROUND
        DwmSetWindowAttribute(Handle, 33, ref pref, sizeof(int));
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        using var pen = new Pen(Color.FromArgb(0x2d, 0x32, 0x50));
        e.Graphics.DrawRectangle(pen, 0, 0, Width - 1, Height - 1);
    }

    protected override CreateParams CreateParams
    {
        get
        {
            var cp = base.CreateParams;
            cp.ExStyle |= 0x80; // WS_EX_TOOLWINDOW: no aparece en Alt+Tab
            cp.ClassStyle |= 0x20000; // CS_DROPSHADOW
            return cp;
        }
    }

    private int Escalar(int dip) => (int)(dip * DeviceDpi / 96f);

    private static uint DpiDe(Screen s)
    {
        var centro = new Point(s.Bounds.Left + s.Bounds.Width / 2, s.Bounds.Top + s.Bounds.Height / 2);
        var mon = MonitorFromPoint(centro, 2 /* MONITOR_DEFAULTTONEAREST */);
        return GetDpiForMonitor(mon, 0, out var dpiX, out _) == 0 ? dpiX : 96;
    }

    [DllImport("dwmapi.dll")]
    private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int value, int size);

    [DllImport("user32.dll")]
    private static extern IntPtr MonitorFromPoint(Point pt, uint flags);

    [DllImport("shcore.dll")]
    private static extern int GetDpiForMonitor(IntPtr hmon, int dpiType, out uint dpiX, out uint dpiY);
}
