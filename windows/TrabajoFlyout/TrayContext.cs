using System.Diagnostics;
using Microsoft.Win32;

namespace TrabajoFlyout;

// Ícono de bandeja con el contador de tareas del día. Clic izquierdo abre/cierra el flyout,
// clic derecho muestra el menú.
internal sealed class TrayContext : ApplicationContext
{
    public const string Url = "https://mytrabajo-mdc.web.app/";

    private readonly NotifyIcon _tray;
    private readonly FlyoutForm _flyout;
    private int? _count;
    private bool _signedOut;

    public TrayContext()
    {
        _flyout = new FlyoutForm(Url);
        _flyout.CountChanged += c => { _count = c; _signedOut = false; RefreshIcon(); };
        _flyout.SignedOut += () => { _count = null; _signedOut = true; RefreshIcon(); };

        var menu = new ContextMenuStrip { Renderer = new DarkMenuRenderer(), ShowImageMargin = false, ShowCheckMargin = true };
        menu.Items.Add("Abrir", null, (_, _) => _flyout.ShowFlyout());
        menu.Items.Add("Abrir en el navegador", null, (_, _) => OpenInBrowser(Url));
        menu.Items.Add("Recargar", null, (_, _) => _flyout.Reload());
        menu.Items.Add(new ToolStripSeparator());
        var autostart = new ToolStripMenuItem("Iniciar con Windows") { Checked = Autostart.IsEnabled, CheckOnClick = true };
        autostart.CheckedChanged += (_, _) => Autostart.Set(autostart.Checked);
        menu.Items.Add(autostart);
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add("Salir", null, (_, _) => ExitThread());
        foreach (ToolStripItem it in menu.Items) it.ForeColor = Color.Gainsboro;

        _tray = new NotifyIcon { ContextMenuStrip = menu, Text = "My Trabajo", Visible = true };
        _tray.MouseClick += (_, e) => { if (e.Button == MouseButtons.Left) _flyout.ToggleFlyout(); };

        SystemEvents.DisplaySettingsChanged += (_, _) => RefreshIcon(); // cambio de escala/DPI
        RefreshIcon();
    }

    private void RefreshIcon()
    {
        var size = Math.Max(16, SystemInformation.SmallIconSize.Width);
        var nuevo = TrayIconRenderer.Render(size, _count ?? 0, _signedOut);
        var viejo = _tray.Icon;
        _tray.Icon = nuevo;
        TrayIconRenderer.Destroy(viejo);

        _tray.Text = _signedOut ? "My Trabajo · sin sesión (abrí para iniciar)"
            : _count is null ? "My Trabajo · cargando…"
            : _count == 0 ? "My Trabajo · nada para hoy"
            : _count == 1 ? "My Trabajo · 1 tarea para hoy"
            : $"My Trabajo · {_count} tareas para hoy";
    }

    private static void OpenInBrowser(string url)
    {
        try { Process.Start(new ProcessStartInfo(url) { UseShellExecute = true }); } catch { /* sin navegador */ }
    }

    protected override void ExitThreadCore()
    {
        _tray.Visible = false;
        TrayIconRenderer.Destroy(_tray.Icon);
        _tray.Dispose();
        _flyout.Quit();
        base.ExitThreadCore();
    }
}

internal static class Autostart
{
    private const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
    private const string Name = "TrabajoFlyout";

    public static bool IsEnabled
    {
        get
        {
            using var k = Registry.CurrentUser.OpenSubKey(RunKey);
            return k?.GetValue(Name) is string;
        }
    }

    public static void Set(bool on)
    {
        using var k = Registry.CurrentUser.CreateSubKey(RunKey);
        if (on) k.SetValue(Name, $"\"{Environment.ProcessPath}\"");
        else k.DeleteValue(Name, false);
    }
}

// Menú contextual oscuro, mismo look que el resto de las apps de bandeja.
internal sealed class DarkMenuRenderer : ToolStripProfessionalRenderer
{
    public DarkMenuRenderer() : base(new DarkColors()) { RoundedEdges = false; }

    protected override void OnRenderItemText(ToolStripItemTextRenderEventArgs e)
    {
        e.TextColor = Color.Gainsboro;
        base.OnRenderItemText(e);
    }

    protected override void OnRenderItemCheck(ToolStripItemImageRenderEventArgs e)
    {
        var r = e.ImageRectangle;
        using var pen = new Pen(Color.FromArgb(0x10, 0xb9, 0x81), 2f);
        e.Graphics.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
        e.Graphics.DrawLines(pen, new[]
        {
            new PointF(r.Left + r.Width * 0.2f, r.Top + r.Height * 0.55f),
            new PointF(r.Left + r.Width * 0.42f, r.Top + r.Height * 0.75f),
            new PointF(r.Left + r.Width * 0.8f, r.Top + r.Height * 0.3f),
        });
    }

    private sealed class DarkColors : ProfessionalColorTable
    {
        private static readonly Color Bg = Color.FromArgb(0x1a, 0x1d, 0x27);
        private static readonly Color Hover = Color.FromArgb(0x22, 0x26, 0x3a);
        private static readonly Color Border = Color.FromArgb(0x2d, 0x32, 0x50);
        public override Color ToolStripDropDownBackground => Bg;
        public override Color ImageMarginGradientBegin => Bg;
        public override Color ImageMarginGradientMiddle => Bg;
        public override Color ImageMarginGradientEnd => Bg;
        public override Color MenuBorder => Border;
        public override Color MenuItemBorder => Hover;
        public override Color MenuItemSelected => Hover;
        public override Color SeparatorDark => Border;
        public override Color SeparatorLight => Border;
        public override Color CheckBackground => Bg;
        public override Color CheckSelectedBackground => Hover;
        public override Color CheckPressedBackground => Hover;
    }
}
