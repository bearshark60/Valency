# VALENCY — Stage 3E.2 Targeted Visual QA Correction for Frontier Mendeleev (sci_men_002_frontier)
# Rebuilds ONLY the two affected layers:
#   1. assets/characters/sci_men_002_frontier/layers/01_background.png
#      - Reconstructs authentic continuous perimeter-sampled backdrop gradient from source_master.png
#        (eliminates tonal step vs. original painted backdrop while keeping layer_bg 100% seamless).
#   2. assets/characters/sci_men_002_frontier/layers/02_body_clothing.png
#      - Exact anti-aliased coat/shoulder/sleeve outer silhouette matte:
#        * 100% solid opaque dark obsidian wool coat & sleeves (zero flood leakage)
#        * 100% transparent background above shoulders & right of sleeve (eliminates y=630 horizontal seam!)
#        * Zero floating left-hair stub
#      - Anatomically grounded under-paint strictly inside the beard-occluded zone:
#        * Shadowed warm human neck cylinder above collar
#        * Continuous standing off-white wing collar wrapping seamlessly behind beard
#        * Clean dress shirt V-placket + dark charcoal-plum silk tie neckband & knot top
#        * Soft curved beard cast shadow + natural top neck fade (zero blurred gray rectangle!)
# Preserves source_master.png, layers 03..13, sci_men_002_institute/*, and all Lavoisier assets untouched.

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$ROOT = 'C:\Users\joshb\.gemini\antigravity\scratch\valency-card-game'
$FDIR = Join-Path $ROOT 'assets\characters\sci_men_002_frontier'
$SRC_PATH = Join-Path $FDIR 'production\source_master.png'
$BG_PATH  = Join-Path $FDIR 'layers\01_background.png'
$BODY_PATH = Join-Path $FDIR 'layers\02_body_clothing.png'

function Clamp255([double]$v) {
  if ($v -lt 0) { return 0 }
  if ($v -gt 255) { return 255 }
  return [int][Math]::Round($v)
}

function Sample-BandMedianRgb($bmp, [int]$x0, [int]$x1, [int]$y) {
  # Sample background strip while ignoring isolated slightly brighter 1-2px grid hairlines by taking lower-40% quantile
  $rs = New-Object System.Collections.Generic.List[int]
  $gs = New-Object System.Collections.Generic.List[int]
  $bs = New-Object System.Collections.Generic.List[int]
  $yy = [Math]::Max(0, [Math]::Min($bmp.Height - 1, $y))
  for ($x = $x0; $x -le $x1; $x += 2) {
    $c = $bmp.GetPixel($x, $yy)
    $rs.Add($c.R); $gs.Add($c.G); $bs.Add($c.B)
  }
  $rs.Sort(); $gs.Sort(); $bs.Sort()
  $idx = [int][Math]::Floor($rs.Count * 0.35)
  return @($rs[$idx], $gs[$idx], $bs[$idx])
}

Write-Host '=== Stage 3E.2 Targeted Fix: Frontier Mendeleev 01_background.png & 02_body_clothing.png ==='
$src = [System.Drawing.Bitmap]::FromFile($SRC_PATH)
$W = $src.Width; $H = $src.Height

# ==============================================================================
# 1. REBUILD 01_background.png — True Continuous Backdrop Gradient From Master
# ==============================================================================
$bg = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Sample true clean left/right background perimeter rows y = 0..700 (above shoulders!)
$leftR = New-Object 'double[]' $H
$leftG = New-Object 'double[]' $H
$leftB = New-Object 'double[]' $H
$rightR = New-Object 'double[]' $H
$rightG = New-Object 'double[]' $H
$rightB = New-Object 'double[]' $H

for ($y = 0; $y -lt $H; $y++) {
  $sy = [Math]::Min(680, $y)
  $l = Sample-BandMedianRgb $src 8 44 $sy
  $r = Sample-BandMedianRgb $src ($W - 45) ($W - 9) $sy
  # Below y=680 gently darken toward bottom coat edge matching original vignette
  $dark = if ($y -gt 680) { 1.0 - (($y - 680.0) / 520.0) * 0.14 } else { 1.0 }
  $leftR[$y]  = $l[0] * $dark; $leftG[$y]  = $l[1] * $dark; $leftB[$y]  = $l[2] * $dark
  $rightR[$y] = $r[0] * $dark; $rightG[$y] = $r[1] * $dark; $rightB[$y] = $r[2] * $dark
}

# Smooth vertical curves with 15px moving average so background is silky continuous
$sLR = New-Object 'double[]' $H; $sLG = New-Object 'double[]' $H; $sLB = New-Object 'double[]' $H
$sRR = New-Object 'double[]' $H; $sRG = New-Object 'double[]' $H; $sRB = New-Object 'double[]' $H
for ($y = 0; $y -lt $H; $y++) {
  $y0 = [Math]::Max(0, $y - 12); $y1 = [Math]::Min($H - 1, $y + 12); $cnt = ($y1 - $y0 + 1)
  $a=0.0; $b=0.0; $c=0.0; $d=0.0; $e=0.0; $f=0.0
  for ($k = $y0; $k -le $y1; $k++) {
    $a += $leftR[$k]; $b += $leftG[$k]; $c += $leftB[$k]
    $d += $rightR[$k]; $e += $rightG[$k]; $f += $rightB[$k]
  }
  $sLR[$y]=$a/$cnt; $sLG[$y]=$b/$cnt; $sLB[$y]=$c/$cnt
  $sRR[$y]=$d/$cnt; $sRG[$y]=$e/$cnt; $sRB[$y]=$f/$cnt
}

for ($y = 0; $y -lt $H; $y++) {
  # Subtle warm-slate central portrait halo matching original source composition
  $cyNorm = ($y - 470.0) / 420.0
  $glowY = [Math]::Exp(-($cyNorm * $cyNorm))
  for ($x = 0; $x -lt $W; $x++) {
    $tx = $x / [double]($W - 1)
    $cxNorm = ($x - 448.0) / 420.0
    $glow = $glowY * [Math]::Exp(-($cxNorm * $cxNorm))
    $rr = ($sLR[$y] * (1.0 - $tx) + $sRR[$y] * $tx) + $glow * 7.5
    $gg = ($sLG[$y] * (1.0 - $tx) + $sRG[$y] * $tx) + $glow * 9.0
    $bb = ($sLB[$y] * (1.0 - $tx) + $sRB[$y] * $tx) + $glow * 13.0
    $bg.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(255, (Clamp255 $rr), (Clamp255 $gg), (Clamp255 $bb)))
  }
}
$bg.Save($BG_PATH, [System.Drawing.Imaging.ImageFormat]::Png)
$bg.Dispose()
Write-Host "Rebuilt 01_background.png (seamless perimeter-matched twilight gradient)"

# ==============================================================================
# 2. REBUILD 02_body_clothing.png — Exact Coat Silhouette + Anatomical Collar/Tie Under-Paint
# ==============================================================================
# Step A: Build crisp anti-aliased alpha mask of the EXACT coat, shoulders, sleeves, collar & upper neck
# (100% solid opaque obsidian coat inside; 100% transparent background outside; zero horizontal seam at y=630!)
$maskBmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gm = [System.Drawing.Graphics]::FromImage($maskBmp)
$gm.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$gm.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

$coatPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$coatPts = @(
  # Left sleeve & shoulder edge (traced pixel-accurate from frontier_shoulder_collar_grid.png)
  (New-Object System.Drawing.PointF(0, 1200)),
  (New-Object System.Drawing.PointF(0, 818)),
  (New-Object System.Drawing.PointF(8, 790)),
  (New-Object System.Drawing.PointF(22, 760)),
  (New-Object System.Drawing.PointF(42, 742)),
  (New-Object System.Drawing.PointF(58, 738)),
  (New-Object System.Drawing.PointF(105, 715)),
  (New-Object System.Drawing.PointF(165, 686)),
  (New-Object System.Drawing.PointF(225, 654)),
  (New-Object System.Drawing.PointF(264, 626)),
  (New-Object System.Drawing.PointF(296, 592)),
  # Left wing collar top & clean curved neck plane behind beard (zero left-hair stub!)
  (New-Object System.Drawing.PointF(312, 566)),
  (New-Object System.Drawing.PointF(345, 560)),
  (New-Object System.Drawing.PointF(430, 574)),
  (New-Object System.Drawing.PointF(525, 582)),
  (New-Object System.Drawing.PointF(604, 592)),
  (New-Object System.Drawing.PointF(628, 624)),
  # Right collar wing tip & right shoulder/sleeve outer edge
  (New-Object System.Drawing.PointF(652, 686)),
  (New-Object System.Drawing.PointF(692, 704)),
  (New-Object System.Drawing.PointF(746, 728)),
  (New-Object System.Drawing.PointF(784, 748)),
  (New-Object System.Drawing.PointF(802, 778)),
  (New-Object System.Drawing.PointF(816, 822)),
  (New-Object System.Drawing.PointF(828, 875)),
  (New-Object System.Drawing.PointF(840, 955)),
  (New-Object System.Drawing.PointF(854, 1035)),
  (New-Object System.Drawing.PointF(872, 1120)),
  (New-Object System.Drawing.PointF(890, 1200))
)
$coatPath.AddPolygon($coatPts)
$whiteBr = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$gm.FillPath($whiteBr, $coatPath)
$whiteBr.Dispose(); $coatPath.Dispose(); $gm.Dispose()

# Step B: Copy original source_master clothing pixels into $body using $maskBmp alpha
# (preserves 100% of painted wool, cyan rim light, waistcoat, buttons, pocket-watch chain, visible collar & tie!)
$body = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 555; $y -lt $H; $y++) {
  for ($x = 0; $x -lt $W; $x++) {
    $ma = $maskBmp.GetPixel($x, $y).A
    if ($ma -eq 0) { continue }
    $c = $src.GetPixel($x, $y)
    # Soft natural top fade strictly along the hidden upper neck rim (y = 560..592) behind jaw/beard
    $topCurve = 566.0 + ([Math]::Max(0.0, ($x - 312.0)) / 316.0) * 30.0
    $topFade = 1.0
    if ($x -ge 338 -and $x -le 625 -and $y -lt ($topCurve + 24.0)) {
      $topFade = [Math]::Max(0.0, [Math]::Min(1.0, ($y - $topCurve) / 24.0))
    }
    $fa = Clamp255($ma * $topFade)
    if ($fa -gt 0) {
      $body.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($fa, $c.R, $c.G, $c.B))
    }
  }
}

# Step C: Paint authentic anatomical collar, shadowed neck, shirt placket & silk tie under-paint
# STRICTLY inside the beard-occluded region (zero grey beard remnants, zero rectangular blur!)
$underPaint = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gu = [System.Drawing.Graphics]::FromImage($underPaint)
$gu.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# 1) Warm shadowed human neck cylinder above the standing wing collar (behind upper beard)
$neckRect = New-Object System.Drawing.Rectangle(345, 558, 285, 165)
$neckBr = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(348, 610)),
  (New-Object System.Drawing.Point(625, 650)),
  [System.Drawing.Color]::FromArgb(255, 128, 94, 86),
  [System.Drawing.Color]::FromArgb(255, 56, 40, 42)
)
$gu.FillRectangle($neckBr, $neckRect)
$neckBr.Dispose()

# Soft vertical beard cast shadow descending down the neck into collar
$neckShadeBr = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(480, 565)),
  (New-Object System.Drawing.Point(480, 710)),
  [System.Drawing.Color]::FromArgb(145, 34, 24, 28),
  [System.Drawing.Color]::FromArgb(30, 34, 24, 28)
)
$gu.FillRectangle($neckShadeBr, $neckRect)
$neckShadeBr.Dispose()

# 2) Continuous standing off-white wing collar wrapping around the neck behind the beard
$collarPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$collarPts = @(
  (New-Object System.Drawing.PointF(340, 594)),
  (New-Object System.Drawing.PointF(388, 636)),
  (New-Object System.Drawing.PointF(445, 654)),
  (New-Object System.Drawing.PointF(520, 658)),
  (New-Object System.Drawing.PointF(585, 650)),
  (New-Object System.Drawing.PointF(628, 628)),
  (New-Object System.Drawing.PointF(652, 686)),
  (New-Object System.Drawing.PointF(592, 720)),
  (New-Object System.Drawing.PointF(508, 726)),
  (New-Object System.Drawing.PointF(396, 712)),
  (New-Object System.Drawing.PointF(352, 660))
)
$collarPath.AddPolygon($collarPts)
$collarBr = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(350, 660)),
  (New-Object System.Drawing.Point(648, 670)),
  [System.Drawing.Color]::FromArgb(255, 214, 206, 192),
  [System.Drawing.Color]::FromArgb(255, 204, 196, 180)
)
$collarBlend = New-Object System.Drawing.Drawing2D.ColorBlend(5)
$collarBlend.Positions = @([float]0.0, [float]0.24, [float]0.52, [float]0.80, [float]1.0)
$collarBlend.Colors = @(
  [System.Drawing.Color]::FromArgb(255, 216, 208, 194),
  [System.Drawing.Color]::FromArgb(255, 168, 160, 152),
  [System.Drawing.Color]::FromArgb(255, 118, 112, 110),
  [System.Drawing.Color]::FromArgb(255, 162, 155, 146),
  [System.Drawing.Color]::FromArgb(255, 212, 204, 188)
)
$collarBr.InterpolationColors = $collarBlend
$gu.FillPath($collarBr, $collarPath)
$collarBr.Dispose(); $collarPath.Dispose()

# 3) Crisp off-white dress shirt placket beneath the collar & flanking the silk tie
$shirtPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$shirtPts = @(
  (New-Object System.Drawing.PointF(396, 708)),
  (New-Object System.Drawing.PointF(604, 704)),
  (New-Object System.Drawing.PointF(606, 795)),
  (New-Object System.Drawing.PointF(428, 795))
)
$shirtPath.AddPolygon($shirtPts)
$shirtBr = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(400, 710)),
  (New-Object System.Drawing.Point(600, 760)),
  [System.Drawing.Color]::FromArgb(255, 208, 200, 188),
  [System.Drawing.Color]::FromArgb(255, 184, 176, 166)
)
$gu.FillPath($shirtBr, $shirtPath)
$shirtBr.Dispose(); $shirtPath.Dispose()

# 4) Continuous dark charcoal-plum silk tie neckband & upper tie knot
$tieBandPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$tieBandPts = @(
  (New-Object System.Drawing.PointF(382, 682)),
  (New-Object System.Drawing.PointF(478, 720)),
  (New-Object System.Drawing.PointF(556, 714)),
  (New-Object System.Drawing.PointF(612, 694)),
  (New-Object System.Drawing.PointF(616, 722)),
  (New-Object System.Drawing.PointF(586, 756)),
  (New-Object System.Drawing.PointF(568, 792)),
  (New-Object System.Drawing.PointF(488, 792)),
  (New-Object System.Drawing.PointF(468, 752)),
  (New-Object System.Drawing.PointF(392, 720))
)
$tieBandPath.AddPolygon($tieBandPts)
$tieBr = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  (New-Object System.Drawing.Point(440, 696)),
  (New-Object System.Drawing.Point(595, 775)),
  [System.Drawing.Color]::FromArgb(255, 34, 28, 42),
  [System.Drawing.Color]::FromArgb(255, 62, 52, 74)
)
$tieBlend = New-Object System.Drawing.Drawing2D.ColorBlend(4)
$tieBlend.Positions = @([float]0.0, [float]0.35, [float]0.68, [float]1.0)
$tieBlend.Colors = @(
  [System.Drawing.Color]::FromArgb(255, 28, 23, 35),
  [System.Drawing.Color]::FromArgb(255, 48, 40, 58),
  [System.Drawing.Color]::FromArgb(255, 66, 56, 78),
  [System.Drawing.Color]::FromArgb(255, 28, 22, 36)
)
$tieBr.InterpolationColors = $tieBlend
$gu.FillPath($tieBr, $tieBandPath)

# Subtle silk crease highlight across tie knot top
$penFold = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(75, 110, 96, 128), 3.0)
$gu.DrawBezier($penFold, 492, 742, 522, 734, 550, 734, 578, 742)
$penFold.Dispose(); $tieBr.Dispose(); $tieBandPath.Dispose()

# 5) Soft natural ambient-occlusion shadow directly beneath the beard perimeter
$aoPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$aoPath.AddEllipse(378, 598, 250, 152)
$aoBr = New-Object System.Drawing.Drawing2D.PathGradientBrush($aoPath)
$aoBr.CenterColor = [System.Drawing.Color]::FromArgb(110, 20, 16, 24)
$aoBr.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 20, 16, 24))
$gu.FillPath($aoBr, $aoPath)
$aoBr.Dispose(); $aoPath.Dispose()
$gu.Dispose()

# Step D: Build a smooth beard-occlusion blend mask (strictly covers ONLY where beard hair sits in source_master,
# feathering smoothly into untouched real collar wings, visible tie knot, and left neck veins!)
$beardMaskBmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gb = [System.Drawing.Graphics]::FromImage($beardMaskBmp)
$gb.Clear([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
$gb.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$bPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$bPts = @(
  # Strictly hugs Mendeleev's painted beard interior on source_master (leaves left neck veins, both collar wings & tie knot untouched!)
  (New-Object System.Drawing.PointF(362, 560)),
  (New-Object System.Drawing.PointF(624, 560)),
  (New-Object System.Drawing.PointF(636, 615)),
  (New-Object System.Drawing.PointF(634, 665)),
  (New-Object System.Drawing.PointF(612, 710)),
  (New-Object System.Drawing.PointF(582, 748)),
  (New-Object System.Drawing.PointF(568, 762)),
  (New-Object System.Drawing.PointF(540, 748)),
  (New-Object System.Drawing.PointF(500, 764)),
  (New-Object System.Drawing.PointF(476, 766)),
  (New-Object System.Drawing.PointF(445, 738)),
  (New-Object System.Drawing.PointF(418, 704)),
  (New-Object System.Drawing.PointF(396, 665)),
  (New-Object System.Drawing.PointF(376, 622))
)
$bPath.AddPolygon($bPts)
$brMask = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$gb.FillPath($brMask, $bPath)
$brMask.Dispose(); $bPath.Dispose(); $gb.Dispose()

# Compute 10px soft inner/outer feather of $beardMaskBmp and composite $underPaint onto $body
$rng = New-Object System.Random(3042)
for ($y = 560; $y -le 778; $y++) {
  for ($x = 350; $x -le 648; $x++) {
    $orig = $body.GetPixel($x, $y)
    if ($orig.A -eq 0) { continue }

    # 9-point box blur of beardMask for silky 10px edge transition into untouched real collar/tie!
    $sum = 0.0
    foreach ($oy in @(-8, -4, 0, 4, 8)) {
      $ny = [Math]::Max(0, [Math]::Min($H - 1, $y + $oy))
      foreach ($ox in @(-8, -4, 0, 4, 8)) {
        $nx = [Math]::Max(0, [Math]::Min($W - 1, $x + $ox))
        $sum += ($beardMaskBmp.GetPixel($nx, $ny).A / 255.0)
      }
    }
    $bw = $sum / 25.0
    if ($bw -le 0.005) { continue }

    # Smoothstep for organic painterly blend
    $bw = $bw * $bw * (3.0 - 2.0 * $bw)
    $u = $underPaint.GetPixel($x, $y)
    # Subtle micro cloth/painterly grain (+-2 RGB) so under-paint matches oil-painted surface texture (not flat plastic!)
    $n = ($rng.NextDouble() - 0.5) * 4.0
    $nr = Clamp255($orig.R * (1.0 - $bw) + ($u.R + $n) * $bw)
    $ng = Clamp255($orig.G * (1.0 - $bw) + ($u.G + $n) * $bw)
    $nb = Clamp255($orig.B * (1.0 - $bw) + ($u.B + $n) * $bw)
    $body.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($orig.A, $nr, $ng, $nb))
  }
}

$body.Save($BODY_PATH, [System.Drawing.Imaging.ImageFormat]::Png)
$body.Dispose(); $underPaint.Dispose(); $beardMaskBmp.Dispose(); $maskBmp.Dispose(); $src.Dispose()
Write-Host "Rebuilt 02_body_clothing.png (solid opaque obsidian coat, clean collar/tie under-paint, zero y=630 seam!)"
