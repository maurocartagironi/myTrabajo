using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.Runtime.InteropServices;

namespace TrabajoFlyout;

// Dibuja el ícono de bandeja: un maletín (el mismo de la app) y, si hay tareas, un globito rojo
// con el número abajo a la derecha. Sin sesión, el maletín sale gris y sin número.
internal static class TrayIconRenderer
{
    private static readonly Color Emerald = Color.FromArgb(0x10, 0xb9, 0x81);
    private static readonly Color Gris = Color.FromArgb(0x64, 0x74, 0x8b);
    private static readonly Color Rojo = Color.FromArgb(0xef, 0x44, 0x44);

    public static Icon Render(int size, int count, bool signedOut)
    {
        using var bmp = new Bitmap(size, size);
        using (var g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.TextRenderingHint = TextRenderingHint.AntiAliasGridFit;
            g.Clear(Color.Transparent);

            float s = size;
            var color = signedOut ? Gris : Emerald;
            bool conBadge = !signedOut && count > 0;

            // Si hay número, el maletín se achica un poco hacia arriba a la izquierda para dejarle lugar.
            float escala = conBadge ? 0.78f : 1f;

            // Manija
            using (var pen = new Pen(color, Math.Max(1.5f, s * 0.09f * escala)))
            {
                var manija = new RectangleF(s * 0.34f * escala, s * 0.12f * escala, s * 0.32f * escala, s * 0.24f * escala);
                using var p = RoundedRect(manija, s * 0.07f * escala);
                g.DrawPath(pen, p);
            }
            // Cuerpo
            var cuerpo = new RectangleF(s * 0.06f * escala, s * 0.30f * escala, s * 0.88f * escala, s * 0.58f * escala);
            using (var p = RoundedRect(cuerpo, s * 0.12f * escala))
            using (var br = new SolidBrush(color))
                g.FillPath(br, p);

            if (conBadge)
            {
                string texto = count > 9 ? "9+" : count.ToString();
                float d = s * (texto.Length > 1 ? 0.62f : 0.56f);
                var circulo = new RectangleF(s - d, s - d, d, d);
                using (var br = new SolidBrush(Rojo)) g.FillEllipse(br, circulo);

                float fontPx = d * (texto.Length > 1 ? 0.62f : 0.78f);
                using var font = new Font("Segoe UI", fontPx, FontStyle.Bold, GraphicsUnit.Pixel);
                using var fmt = new StringFormat { Alignment = StringAlignment.Center, LineAlignment = StringAlignment.Center };
                var textRect = circulo;
                textRect.Offset(0, d * 0.03f); // Segoe UI queda un pelín alta
                g.DrawString(texto, font, Brushes.White, textRect, fmt);
            }
        }
        return Icon.FromHandle(bmp.GetHicon());
    }

    public static void Destroy(Icon? icon)
    {
        if (icon == null) return;
        var h = icon.Handle;
        icon.Dispose();
        DestroyIcon(h);
    }

    private static GraphicsPath RoundedRect(RectangleF r, float radio)
    {
        float d = radio * 2;
        var p = new GraphicsPath();
        p.AddArc(r.X, r.Y, d, d, 180, 90);
        p.AddArc(r.Right - d, r.Y, d, d, 270, 90);
        p.AddArc(r.Right - d, r.Bottom - d, d, d, 0, 90);
        p.AddArc(r.X, r.Bottom - d, d, d, 90, 90);
        p.CloseFigure();
        return p;
    }

    [DllImport("user32.dll", SetLastError = true)]
    private static extern bool DestroyIcon(IntPtr hIcon);
}
