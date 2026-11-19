namespace TrabajoFlyout;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        // Una sola instancia: si ya está corriendo (ej. arrancó con Windows), no abre otra.
        using var mutex = new Mutex(true, "TrabajoFlyout_SingleInstance", out bool esNueva);
        if (!esNueva) return;

        ApplicationConfiguration.Initialize();
        Application.Run(new TrayContext());
    }
}
