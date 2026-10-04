# Native Windows raster export of the editable SVG-inspired card. No package dependency.
Add-Type -AssemblyName System.Drawing
$outPath = Join-Path $PSScriptRoot '..\public\social\odesosgames-card.png'
$bitmap = [System.Drawing.Bitmap]::new(1200, 630)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

function Brush([string]$hex) { [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml($hex)) }
function Font([float]$size, [System.Drawing.FontStyle]$style) { [System.Drawing.Font]::new('Arial', $size, $style, [System.Drawing.GraphicsUnit]::Pixel) }

$background = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.Rectangle]::new(0, 0, 1200, 630),
  [System.Drawing.ColorTranslator]::FromHtml('#091329'),
  [System.Drawing.ColorTranslator]::FromHtml('#1d1240'), 28)
$graphics.FillRectangle($background, 0, 0, 1200, 630)
$graphics.FillEllipse((Brush '#332254'), 780, -130, 480, 480)
$cyanPen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#376e99'), 5)
$violetPen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#71499d'), 4)
$graphics.DrawEllipse($cyanPen, 887, 244, 336, 336)
$graphics.DrawEllipse($violetPen, 941, 298, 228, 228)
$graphics.FillEllipse((Brush '#8a54d5'), 1005, 362, 100, 100)
$graphics.DrawLine([System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#7dd3fc'), 4), 835, 491, 1085, 208)
$graphics.FillEllipse((Brush '#fcd34d'), 857, 437, 26, 26)
$graphics.FillRectangle((Brush '#704dc9'), 75, 76, 82, 82)
$markPen = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#ffffff'), 10)
$markPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$markPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$graphics.DrawLines($markPen, [System.Drawing.Point[]]@(
  [System.Drawing.Point]::new(98, 117),
  [System.Drawing.Point]::new(113, 133),
  [System.Drawing.Point]::new(137, 98)
))
$graphics.DrawString('OdesosGames', (Font 46 Bold), (Brush '#f8fafc'), 180, 77)
$graphics.DrawString('Small games.', (Font 74 Bold), (Brush '#ffffff'), 75, 222)
$graphics.DrawString('Big moments.', (Font 74 Bold), (Brush '#7dd3fc'), 75, 309)
$graphics.DrawString('Play Orbit Break and Reactor Stack in your browser.', (Font 31 Regular), (Brush '#cbd5e1'), 78, 463)
$graphics.DrawLine([System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml('#64748b'), 2), 78, 553, 818, 553)
$graphics.DrawString('ODESOSGAMES.COM', (Font 23 Regular), (Brush '#a5b4fc'), 78, 562)
$bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
Write-Output $outPath
