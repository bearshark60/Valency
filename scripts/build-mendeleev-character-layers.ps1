# VALENCY — Stage 3E.2 Production Painterly Layer Extraction & Under-Paint Builder for Dmitri Mendeleev
# Follows docs/SCIENTIST_PRODUCTION_STANDARD.md (Stage 3D.3 standard) with Mendeleev-specific
# beard-safe jaw articulation, mustache-safe mouth masking, and beard-to-collar under-paint.
# Strictly modular: touches ONLY assets/characters/sci_men_002_* (zero edits to Lavoisier or shared code).

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$ROOT = 'C:\Users\joshb\.gemini\antigravity\scratch\valency-card-game'
$INST_REFINED_SRC = 'C:\Users\joshb\.gemini\antigravity\brain\1104dbc4-ef03-4aaf-850f-c8abbd1dc5f5\mendeleev_institute_master_v3_1795576558159.jpg'

function New-BlankBitmap([int]$w, [int]$h) {
  return New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
}

function Clamp255([double]$v) {
  if ($v -lt 0) { return 0 }
  if ($v -gt 255) { return 255 }
  return [int][Math]::Round($v)
}

function Sample-AvgColor($bmp, [int]$cx, [int]$cy, [int]$r) {
  $sr = 0; $sg = 0; $sb = 0; $n = 0
  for ($y = [Math]::Max(0, $cy - $r); $y -le [Math]::Min($bmp.Height - 1, $cy + $r); $y += 2) {
    for ($x = [Math]::Max(0, $cx - $r); $x -le [Math]::Min($bmp.Width - 1, $cx + $r); $x += 2) {
      $c = $bmp.GetPixel($x, $y)
      $sr += $c.R; $sg += $c.G; $sb += $c.B; $n++
    }
  }
  if ($n -eq 0) { return [System.Drawing.Color]::FromArgb(255, 14, 20, 32) }
  return [System.Drawing.Color]::FromArgb(255, [int]($sr / $n), [int]($sg / $n), [int]($sb / $n))
}

# Build framing-aligned 896x1200 lossless production source_master.png
# Shifts bust downward by $shiftY px (adding seamless top backdrop extension) so eyes align
# to y ~ 384-392 (32-33%) and headroom sits cleanly inside 12-15% per SCIENTIST_PRODUCTION_STANDARD.md §2.
function Build-AlignedMaster($rawPath, [int]$shiftY, [string]$outPngPath) {
  $raw = [System.Drawing.Bitmap]::FromFile($rawPath)
  $W = $raw.Width; $H = $raw.Height
  $master = New-BlankBitmap $W $H
  $g = [System.Drawing.Graphics]::FromImage($master)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

  # Extend top backdrop seamlessly using vertical stretch of the clean top 16px band
  if ($shiftY -gt 0) {
    $topH = $shiftY + 6
    $g.DrawImage(
      $raw,
      (New-Object System.Drawing.Rectangle(0, 0, $W, $topH)),
      (New-Object System.Drawing.Rectangle(0, 0, $W, 18)),
      [System.Drawing.GraphicsUnit]::Pixel
    )
  }
  # Draw exact lossless 1:1 original pixels shifted cleanly down by $shiftY
  $remH = $H - $shiftY
  $g.DrawImage(
    $raw,
    (New-Object System.Drawing.Rectangle(0, $shiftY, $W, $remH)),
    (New-Object System.Drawing.Rectangle(0, 0, $W, $remH)),
    [System.Drawing.GraphicsUnit]::Pixel
  )
  $g.Dispose()
  $raw.Dispose()
  $master.Save($outPngPath, [System.Drawing.Imaging.ImageFormat]::Png)
  return $master
}

function Save-FeatheredEllipseLayer($src, [string]$outPath, [double]$cx, [double]$cy, [double]$rx, [double]$ry, [double]$feather, [double]$clipMinY = -1, [double]$clipMaxY = 99999) {
  $out = New-BlankBitmap $src.Width $src.Height
  $x0 = [Math]::Max(0, [int][Math]::Floor($cx - $rx - 2))
  $x1 = [Math]::Min($src.Width - 1, [int][Math]::Ceiling($cx + $rx + 2))
  $y0 = [Math]::Max(0, [int][Math]::Floor($cy - $ry - 2))
  $y1 = [Math]::Min($src.Height - 1, [int][Math]::Ceiling($cy + $ry + 2))
  $inner = [Math]::Max(0.05, 1.0 - $feather)

  for ($y = $y0; $y -le $y1; $y++) {
    if ($y -lt $clipMinY -or $y -gt $clipMaxY) { continue }
    $dy = ($y - $cy) / $ry
    # Optional soft feather near top clip (protects mustache over mouth & lower lip over jaw!)
    $clipFactor = 1.0
    if ($clipMinY -ge 0 -and ($y - $clipMinY) -lt 8) {
      $clipFactor = ($y - $clipMinY) / 8.0
    }
    if ($clipMaxY -lt 90000 -and ($clipMaxY - $y) -lt 8) {
      $clipFactor = [Math]::Min($clipFactor, ($clipMaxY - $y) / 8.0)
    }

    for ($x = $x0; $x -le $x1; $x++) {
      $dx = ($x - $cx) / $rx
      $d = [Math]::Sqrt($dx * $dx + $dy * $dy)
      if ($d -le 1.0) {
        $baseA = if ($d -le $inner) { 1.0 } else { 1.0 - ($d - $inner) / $feather }
        $alpha = Clamp255(255.0 * $baseA * $clipFactor)
        if ($alpha -gt 0) {
          $c = $src.GetPixel($x, $y)
          $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
        }
      }
    }
  }
  $out.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
}

# Smooth 2D cross-interpolated skin under-paint (vertical + horizontal perimeter blend -> zero streaks!)
function Inpaint-Ellipse2D($target, [double]$cx, [double]$cy, [double]$rx, [double]$ry, [double]$feather, [double]$vWeight = 0.62) {
  $copy = $target.Clone()
  $x0 = [Math]::Max(2, [int][Math]::Floor($cx - $rx))
  $x1 = [Math]::Min($target.Width - 3, [int][Math]::Ceiling($cx + $rx))
  $y0 = [Math]::Max(2, [int][Math]::Floor($cy - $ry))
  $y1 = [Math]::Min($target.Height - 3, [int][Math]::Ceiling($cy + $ry))
  $inner = [Math]::Max(0.05, 1.0 - $feather)
  $hWeight = 1.0 - $vWeight

  for ($y = $y0; $y -le $y1; $y++) {
    $dy = ($y - $cy) / $ry
    if ([Math]::Abs($dy) -ge 1.0) { continue }
    $xSpan = $rx * [Math]::Sqrt(1.0 - $dy * $dy)
    $leftX = [Math]::Max(2, [int][Math]::Floor($cx - $xSpan - 6))
    $rightX = [Math]::Min($target.Width - 3, [int][Math]::Ceiling($cx + $xSpan + 6))
    $cLeft = Sample-AvgColor $copy $leftX $y 2
    $cRight = Sample-AvgColor $copy $rightX $y 2

    for ($x = $x0; $x -le $x1; $x++) {
      $dx = ($x - $cx) / $rx
      $d = [Math]::Sqrt($dx * $dx + $dy * $dy)
      if ($d -le 1.0) {
        $ySpan = $ry * [Math]::Sqrt([Math]::Max(0.0, 1.0 - $dx * $dx))
        $topY = [Math]::Max(2, [int][Math]::Floor($cy - $ySpan - 6))
        $botY = [Math]::Min($target.Height - 3, [int][Math]::Ceiling($cy + $ySpan + 6))
        $cTop = Sample-AvgColor $copy $x $topY 2
        $cBot = Sample-AvgColor $copy $x $botY 2

        $ty = ($y - $topY) / [Math]::Max(1.0, ($botY - $topY))
        $tx = ($x - $leftX) / [Math]::Max(1.0, ($rightX - $leftX))
        $vr = $cTop.R * (1.0 - $ty) + $cBot.R * $ty
        $vg = $cTop.G * (1.0 - $ty) + $cBot.G * $ty
        $vb = $cTop.B * (1.0 - $ty) + $cBot.B * $ty
        $hr = $cLeft.R * (1.0 - $tx) + $cRight.R * $tx
        $hg = $cLeft.G * (1.0 - $tx) + $cRight.G * $tx
        $hb = $cLeft.B * (1.0 - $tx) + $cRight.B * $tx

        $fr = $vWeight * $vr + $hWeight * $hr
        $fg = $vWeight * $vg + $hWeight * $hg
        $fb = $vWeight * $vb + $hWeight * $hb

        $w = if ($d -le $inner) { 1.0 } else { 1.0 - ($d - $inner) / $feather }
        $orig = $copy.GetPixel($x, $y)
        $target.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(
          $orig.A,
          (Clamp255($orig.R * (1.0 - $w) + $fr * $w)),
          (Clamp255($orig.G * (1.0 - $w) + $fg * $w)),
          (Clamp255($orig.B * (1.0 - $w) + $fb * $w))
        ))
      }
    }
  }
  $copy.Dispose()
}

# Tight, naturally shaded sclera under-paint strictly INSIDE the lower eye aperture (preserves real painted upper lash line!)
function Fill-ScleraNatural($target, $src, [double]$cx, [double]$cy, [double]$rx, [double]$ry) {
  $cA = Sample-AvgColor $src ([int]($cx - $rx * 0.56)) ([int]($cy + 1)) 2
  $cB = Sample-AvgColor $src ([int]($cx + $rx * 0.56)) ([int]($cy + 1)) 2
  $srBase = ($cA.R + $cB.R) * 0.5
  $sgBase = ($cA.G + $cB.G) * 0.5
  $sbBase = ($cA.B + $cB.B) * 0.5

  $eyCy = $cy + 1.5
  $eyRx = $rx - 4.0
  $eyRy = $ry - 3.0

  $x0 = [Math]::Max(0, [int][Math]::Floor($cx - $eyRx))
  $x1 = [Math]::Min($target.Width - 1, [int][Math]::Ceiling($cx + $eyRx))
  $y0 = [Math]::Max(0, [int][Math]::Floor($eyCy - $eyRy))
  $y1 = [Math]::Min($target.Height - 1, [int][Math]::Ceiling($eyCy + $eyRy))

  for ($y = $y0; $y -le $y1; $y++) {
    $dy = ($y - $eyCy) / $eyRy
    for ($x = $x0; $x -le $x1; $x++) {
      $dx = ($x - $cx) / $eyRx
      $d = [Math]::Sqrt($dx * $dx + $dy * $dy)
      if ($d -le 1.0) {
        $topNorm = ($y - ($eyCy - $eyRy)) / [Math]::Max(1.0, 2.0 * $eyRy)
        $shade = 0.68 + 0.34 * [Math]::Min(1.0, $topNorm * 1.45)
        $w = if ($d -le 0.68) { 0.92 } else { 0.92 * (1.0 - ($d - 0.68) / 0.32) }
        $orig = $target.GetPixel($x, $y)
        $target.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(
          $orig.A,
          (Clamp255($orig.R * (1.0 - $w) + ($srBase * $shade) * $w)),
          (Clamp255($orig.G * (1.0 - $w) + ($sgBase * $shade) * $w)),
          (Clamp255($orig.B * (1.0 - $w) + ($sbBase * $shade) * $w))
        ))
      }
    }
  }
}

# Build painted upper eyelid directly from real upper-eyelid crease pixels strictly BELOW heavy brow hairs
function Save-NaturalPaintedEyelid($src, [string]$outPath, [int]$cx, [int]$cy, [int]$rx, [int]$ry, [System.Drawing.Color]$lashColor) {
  $out = New-BlankBitmap $src.Width $src.Height
  $lidTop = $cy - $ry - 26
  $lidBot = $cy - $ry + 2
  $x0 = $cx - $rx - 6
  $x1 = $cx + $rx + 6

  # Compute clean eyelid crease skin band strictly below Mendeleev's heavy brow ridge (cy - ry - 7 .. cy - ry - 2)
  # Reject any dark brow-hair outlier pixels by blending toward the brightest warm/alabaster skin pixel in each column!
  for ($x = $x0; $x -le $x1; $x++) {
    $bestR = 0; $bestG = 0; $bestB = 0; $bestLum = -1.0
    for ($sy = ($cy - $ry - 7); $sy -le ($cy - $ry - 1); $sy++) {
      $p = $src.GetPixel($x, $sy)
      $lum = ($p.R + $p.G + $p.B) / 3.0
      if ($lum -gt $bestLum) { $bestLum = $lum; $bestR = $p.R; $bestG = $p.G; $bestB = $p.B }
    }
    for ($y = $lidTop; $y -le $lidBot; $y++) {
      $t = ($y - $lidTop) / [Math]::Max(1.0, ($lidBot - $lidTop))
      $srcY = [int][Math]::Round(($cy - $ry - 6) + $t * 4.0)
      $c = $src.GetPixel($x, $srcY)
      $cLum = ($c.R + $c.G + $c.B) / 3.0
      # If sample hits dark brow shadow/hair, cleanly substitute the column's true eyelid skin tone
      $useR = if ($cLum -lt ($bestLum - 18)) { $bestR * 0.94 } else { $c.R * 0.55 + $bestR * 0.45 }
      $useG = if ($cLum -lt ($bestLum - 18)) { $bestG * 0.94 } else { $c.G * 0.55 + $bestG * 0.45 }
      $useB = if ($cLum -lt ($bestLum - 18)) { $bestB * 0.94 } else { $c.B * 0.55 + $bestB * 0.45 }
      # Subtle natural upper-lid dome shading (slightly brighter crease center, darker at lower lash margin)
      $dome = 0.92 + 0.10 * [Math]::Sin($t * [Math]::PI)
      $edgeShade = if ($t -gt 0.76) { 1.0 - (($t - 0.76) / 0.24) * 0.44 } else { 1.0 }
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(
        255,
        (Clamp255($useR * $dome * $edgeShade)),
        (Clamp255($useG * $dome * $edgeShade)),
        (Clamp255($useB * $dome * $edgeShade))
      ))
    }
  }
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $penLash = New-Object System.Drawing.Pen($lashColor, 2.5)
  $penLash.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penLash.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawBezier($penLash, ($cx - $rx - 2), ($lidBot - 1), ($cx - [int]($rx * 0.4)), ($lidBot - 5), ($cx + [int]($rx * 0.4)), ($lidBot - 5), ($cx + $rx + 2), ($lidBot - 1))
  $penLash.Dispose(); $g.Dispose()
  $out.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
}

# Perimeter BFS flood-fill with thin-line bypass (sails cleanly across thin concentric Academy rings & periodic grid lines
# without EVER trapping background discs or grid flaps onto 04_face_head.png or 02_body_clothing.png!)
function Compute-BackgroundMask($src, [int]$bgThresh, [int]$shoulderSplitSy) {
  $W = $src.Width; $H = $src.Height
  $bgRef = Sample-AvgColor $src 36 36 10
  $sw = [int]($W / 2); $sh = [int]($H / 2)

  # Precompute per-half-res pixel distance to background reference
  $distGrid = New-Object 'double[,]' $sw, $sh
  for ($y = 0; $y -lt $sh; $y++) {
    for ($x = 0; $x -lt $sw; $x++) {
      $px = $src.GetPixel($x * 2, $y * 2)
      $dr = $px.R - $bgRef.R; $dg = $px.G - $bgRef.G; $db = $px.B - $bgRef.B
      $distGrid[$x, $y] = [Math]::Sqrt($dr * $dr + $dg * $dg + $db * $db)
    }
  }

  $isBg = New-Object 'bool[,]' $sw, $sh
  $q = New-Object 'System.Collections.Generic.Queue[int]'

  for ($x = 0; $x -lt $sw; $x++) {
    $isBg[$x, 0] = $true; $q.Enqueue($x)
  }
  for ($y = 1; $y -lt [Math]::Min($sh, $shoulderSplitSy + 70); $y++) {
    $isBg[0, $y] = $true; $q.Enqueue($y * $sw)
    $isBg[($sw - 1), $y] = $true; $q.Enqueue($y * $sw + ($sw - 1))
  }

  $dx4 = @(-1, 1, 0, 0); $dy4 = @(0, 0, -1, 1)
  while ($q.Count -gt 0) {
    $idx = $q.Dequeue()
    $x = $idx % $sw; $y = [int][Math]::Floor($idx / $sw)
    for ($k = 0; $k -lt 4; $k++) {
      $nx = $x + $dx4[$k]; $ny = $y + $dy4[$k]
      if ($nx -lt 0 -or $nx -ge $sw -or $ny -lt 0 -or $ny -ge $sh) { continue }
      if ($isBg[$nx, $ny]) { continue }
      $dSelf = $distGrid[$nx, $ny]
      $lim = if ($ny -gt $shoulderSplitSy) { [Math]::Max(13, $bgThresh - 10) } else { $bgThresh }
      $pass = ($dSelf -le $lim)

      # Thin-line bypass: if a faint 1-3px background ring or periodic grid line blocks the flood above shoulders,
      # check if the pixel 3 half-res steps further in the same direction (6px) is pure background AND this pixel isn't bright hair/skin!
      if (-not $pass -and $ny -le ($shoulderSplitSy + 20) -and $dSelf -le 85) {
        $bx = $nx + $dx4[$k] * 3; $by = $ny + $dy4[$k] * 3
        if ($bx -ge 0 -and $bx -lt $sw -and $by -ge 0 -and $by -lt $sh) {
          if ($distGrid[$bx, $by] -le ($lim + 4)) {
            $pass = $true
          }
        }
      }

      if ($pass) {
        $isBg[$nx, $ny] = $true
        $q.Enqueue($ny * $sw + $nx)
      }
    }
  }
  return ,$isBg
}

# Build clean beard-safe head/body split + continuous collar/tie under-paint behind beard
function Build-MendeleevCharacter($cfg) {
  Write-Host "`n=== Building Stage 3E.2 Painterly Production Assets for $($cfg.id) ==="
  $charDir = Join-Path $ROOT "assets\characters\$($cfg.id)"
  $prodDir = Join-Path $charDir 'production'
  $layerDir = Join-Path $charDir 'layers'
  $qaDir = Join-Path $charDir 'qa'
  New-Item -ItemType Directory -Path $prodDir -Force | Out-Null
  New-Item -ItemType Directory -Path $layerDir -Force | Out-Null
  New-Item -ItemType Directory -Path $qaDir -Force | Out-Null

  $masterPath = Join-Path $prodDir 'source_master.png'
  $src = Build-AlignedMaster $cfg.sourcePath $cfg.shiftY $masterPath
  $W = $src.Width; $H = $src.Height

  # 1. Clean continuous full-bleed background (01_background.png)
  $bgOut = New-BlankBitmap $W $H
  $bgTopLeft = Sample-AvgColor $src 36 36 12
  $bgCenter = [System.Drawing.Color]::FromArgb(
    255,
    (Clamp255($bgTopLeft.R + $cfg.bgGlowR)),
    (Clamp255($bgTopLeft.G + $cfg.bgGlowG)),
    (Clamp255($bgTopLeft.B + $cfg.bgGlowB))
  )
  $gBg = [System.Drawing.Graphics]::FromImage($bgOut)
  $gBg.Clear($bgTopLeft)
  $pathBg = New-Object System.Drawing.Drawing2D.GraphicsPath
  $pathBg.AddEllipse(-60, 40, $W + 120, $H - 120)
  $pgb = New-Object System.Drawing.Drawing2D.PathGradientBrush($pathBg)
  $pgb.CenterColor = $bgCenter
  $pgb.SurroundColors = @($bgTopLeft)
  $gBg.FillPath($pgb, $pathBg)
  $pgb.Dispose(); $pathBg.Dispose(); $gBg.Dispose()
  $bgOut.Save((Join-Path $layerDir '01_background.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $bgOut.Dispose()

  # 2. Perimeter flood-fill background segmentation -> razor-clean foreground silhouette
  $isBg = Compute-BackgroundMask $src $cfg.bgThresh $cfg.shoulderSplitSy
  $sw = [int]($W / 2); $sh = [int]($H / 2)

  $fgBody = New-BlankBitmap $W $H
  $fgHead = New-BlankBitmap $W $H

  $beardCx = $cfg.beardCx
  $beardHalfW = $cfg.beardHalfW
  $neckShoulderY = $cfg.neckShoulderY
  $beardTipY = $cfg.beardTipY

  for ($y = 0; $y -lt $H; $y++) {
    $sy = [Math]::Min($sh - 1, [int]($y / 2))
    for ($x = 0; $x -lt $W; $x++) {
      $sx = [Math]::Min($sw - 1, [int]($x / 2))
      $fgVotes = 0
      for ($oy = -1; $oy -le 1; $oy++) {
        $ny = [Math]::Max(0, [Math]::Min($sh - 1, $sy + $oy))
        for ($ox = -1; $ox -le 1; $ox++) {
          $nx = [Math]::Max(0, [Math]::Min($sw - 1, $sx + $ox))
          if (-not $isBg[$nx, $ny]) { $fgVotes++ }
        }
      }
      if ($fgVotes -eq 0) { continue }
      $fgAlpha = Clamp255(($fgVotes / 9.0) * 255.0)
      $c = $src.GetPixel($x, $y)

      # Smooth cascading beard boundary curve: rises smoothly to neckShoulderY outside the beard,
      # dips cleanly down to beardTipY along the patriarchal beard mass.
      $bxNorm = ($x - $beardCx) / $beardHalfW
      $beardDip = ($beardTipY - $neckShoulderY) * [Math]::Exp(-[Math]::Pow($bxNorm, 2) * 1.45)
      $headBottomCurve = $neckShoulderY + $beardDip

      # Body starts ~72px above the lower collar/beard curve so collar & tie stay continuous behind beard movement!
      $bodyStart = $neckShoulderY - 58
      if ($y -ge $bodyStart) {
        $bFade = if ($y -lt ($bodyStart + 24)) { ($y - $bodyStart) / 24.0 } else { 1.0 }
        $ba = Clamp255($fgAlpha * $bFade)
        $fgBody.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($ba, $c.R, $c.G, $c.B))
      }

      # Head+hair+beard silhouette: exclude dark coat/tie pixels outside the bright beard strands in the lower overlap zone!
      if ($y -le ($headBottomCurve + 12)) {
        $hFade = if ($y -gt ($headBottomCurve - 16)) { 1.0 - ($y - ($headBottomCurve - 16)) / 28.0 } else { 1.0 }
        # In the lower beard-over-coat zone (y > neckShoulderY + 12), refine edge by luminance so dark coat/tie stays strictly on body!
        if ($cfg.beardLumRefine -and $y -gt ($neckShoulderY + 14)) {
          $lum = ($c.R + $c.G + $c.B) / 3.0
          if ($lum -lt $cfg.beardMinLum) {
            $hFade = $hFade * [Math]::Max(0.0, ($lum - ($cfg.beardMinLum - 26.0)) / 26.0)
          }
        }
        $ha = Clamp255($fgAlpha * $hFade)
        if ($ha -gt 0) {
          $fgHead.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($ha, $c.R, $c.G, $c.B))
        }
      }
    }
  }

  # Under-paint body clothing behind the ENTIRE beard overlap zone (from neckShoulderY - 58 down to beardTipY + 8)
  # so 02_body_clothing shows clean collar & cravat/tie continuity with ZERO ghost beard band!
  $bodyCopy = $fgBody.Clone()
  $uY0 = [Math]::Max(0, $neckShoulderY - 58)
  $uY1 = $beardTipY + 8
  for ($y = $uY0; $y -le $uY1; $y++) {
    $frac = ($y - $uY0) / [Math]::Max(1.0, ($uY1 - $uY0))
    $halfSpan = $beardHalfW * (1.06 - $frac * 0.56)
    $lx = [Math]::Max(4, [int]($beardCx - $halfSpan - 14))
    $rx = [Math]::Min($W - 5, [int]($beardCx + $halfSpan + 14))
    $sampleY = [Math]::Min($H - 12, [Math]::Max($neckShoulderY + 28, $y + 18))
    $cL = Sample-AvgColor $bodyCopy $lx $sampleY 3
    $cR = Sample-AvgColor $bodyCopy $rx $sampleY 3
    $cBot = Sample-AvgColor $bodyCopy ([int]$beardCx) ([Math]::Min($H - 10, $beardTipY + 26)) 4
    for ($x = [Math]::Max(0, [int]($beardCx - $halfSpan)); $x -le [Math]::Min($W - 1, [int]($beardCx + $halfSpan)); $x++) {
      $orig = $fgBody.GetPixel($x, $y)
      if ($orig.A -eq 0) { continue }
      $tx = ($x - ($beardCx - $halfSpan)) / [Math]::Max(1.0, (2.0 * $halfSpan))
      $edgeDist = [Math]::Min($tx, 1.0 - $tx) * 2.0
      $blendW = [Math]::Min(1.0, $edgeDist * 2.4) * (1.0 - [Math]::Max(0.0, ($frac - 0.78) / 0.22))
      if ($blendW -le 0.01) { continue }
      $lr = $cL.R * (1.0 - $tx) + $cR.R * $tx
      $lg = $cL.G * (1.0 - $tx) + $cR.G * $tx
      $lb = $cL.B * (1.0 - $tx) + $cR.B * $tx
      # Center column favors silk cravat/tie tone; outer flanks favor wing collar tone!
      $centerBias = [Math]::Exp(-[Math]::Pow(($tx - 0.5) / 0.28, 2))
      $cravatW = 0.22 + 0.52 * $centerBias
      $fr = (1.0 - $cravatW) * $lr + $cravatW * $cBot.R
      $fg = (1.0 - $cravatW) * $lg + $cravatW * $cBot.G
      $fb = (1.0 - $cravatW) * $lb + $cravatW * $cBot.B
      $fgBody.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(
        $orig.A,
        (Clamp255($orig.R * (1.0 - $blendW) + $fr * $blendW)),
        (Clamp255($orig.G * (1.0 - $blendW) + $fg * $blendW)),
        (Clamp255($orig.B * (1.0 - $blendW) + $fb * $blendW))
      ))
    }
  }
  $bodyCopy.Dispose()

  $fgBody.Save((Join-Path $layerDir '02_body_clothing.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $fgBody.Dispose()

  # 3. Movable Facial Features (extracted from aligned source_master BEFORE under-painting!)
  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '05_eye_left_iris.png')  $cfg.eyeL.cx $cfg.eyeL.cy ($cfg.eyeL.irisR + 2) ($cfg.eyeL.irisR + 2) 0.30
  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '06_eye_right_iris.png') $cfg.eyeR.cx $cfg.eyeR.cy ($cfg.eyeR.irisR + 2) ($cfg.eyeR.irisR + 2) 0.30

  Save-NaturalPaintedEyelid $src (Join-Path $layerDir '07_lid_left_upper.png')  $cfg.eyeL.cx $cfg.eyeL.cy $cfg.eyeL.rx $cfg.eyeL.ry $cfg.lashColor
  Save-NaturalPaintedEyelid $src (Join-Path $layerDir '08_lid_right_upper.png') $cfg.eyeR.cx $cfg.eyeR.cy $cfg.eyeR.rx $cfg.eyeR.ry $cfg.lashColor

  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '09_brow_left.png')  $cfg.browL.cx $cfg.browL.cy $cfg.browL.rx $cfg.browL.ry 0.42
  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '10_brow_right.png') $cfg.browR.cx $cfg.browR.cy $cfg.browR.rx $cfg.browR.ry 0.42

  # Mustache-safe mouth extraction: soft top clip preserves sweeping mustache intact on 04_face_head!
  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '11_mouth.png') $cfg.mouth.cx $cfg.mouth.cy $cfg.mouth.rx $cfg.mouth.ry 0.38 ($cfg.mouth.cy - $cfg.mouth.ry + 2) ($cfg.mouth.cy + $cfg.mouth.ry)

  # Beard-safe lower jaw + cascading central beard mass strictly BELOW lower-lip shadow!
  $jawMinY = $cfg.mouth.cy + 13
  Save-FeatheredEllipseLayer $fgHead (Join-Path $layerDir '12_jaw_lower.png') $cfg.jaw.cx $cfg.jaw.cy $cfg.jaw.rx $cfg.jaw.ry 0.44 $jawMinY 99999

  # 4. Rear Hair (shoulder-length sweeping nape/back hair strictly OUTSIDE beard & cheek perimeter!)
  $rearOut = New-BlankBitmap $W $H
  foreach ($rBox in $cfg.hairRearBoxes) {
    for ($y = $rBox.y0; $y -le $rBox.y1; $y++) {
      $dy = ($y - $rBox.cy) / $rBox.ry
      for ($x = $rBox.x0; $x -le $rBox.x1; $x++) {
        $dx = ($x - $rBox.cx) / $rBox.rx
        $d = [Math]::Sqrt($dx * $dx + $dy * $dy)
        if ($d -le 1.0) {
          $sx = [Math]::Min($sw - 1, [int]($x / 2)); $sy = [Math]::Min($sh - 1, [int]($y / 2))
          if ($isBg[$sx, $sy]) { continue }
          $a = if ($d -le 0.62) { 255 } else { Clamp255(255.0 * (1.0 - ($d - 0.62) / 0.38)) }
          $c = $src.GetPixel($x, $y)
          $rearOut.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $c.R, $c.G, $c.B))
        }
      }
    }
  }
  $rearOut.Save((Join-Path $layerDir '03_hair_rear.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $rearOut.Dispose()

  # 5. Front Hair (sweeping iron-grey/silver crown & upper mane — excludes warm forehead skin AND excludes lower beard!)
  $hairFrontOut = New-BlankBitmap $W $H
  $hf = $cfg.hairFront
  for ($y = $hf.yMin; $y -le $hf.yMax; $y++) {
    $sy = [Math]::Min($sh - 1, [int]($y / 2))
    for ($x = $hf.xMin; $x -le $hf.xMax; $x++) {
      $sx = [Math]::Min($sw - 1, [int]($x / 2))
      if ($isBg[$sx, $sy]) { continue }
      $dFace = [Math]::Sqrt([Math]::Pow(($x - $hf.faceExcludeCx) / $hf.faceExcludeRx, 2) + [Math]::Pow(($y - $hf.faceExcludeCy) / $hf.faceExcludeRy, 2))
      if ($dFace -le 1.0) { continue }
      $c = $src.GetPixel($x, $y)
      $warmth = $c.R - $c.B
      $lum = ($c.R + $c.G + $c.B) / 3.0
      if ($lum -gt $hf.minLum -and $warmth -lt $hf.maxWarmth) {
        $edgeA = if ($dFace -lt 1.14) { (($dFace - 1.0) / 0.14) } else { 1.0 }
        $botA = if ($y -gt ($hf.yMax - 36)) { ($hf.yMax - $y) / 36.0 } else { 1.0 }
        $finalA = Clamp255(255.0 * $edgeA * $botA)
        if ($finalA -gt 0) {
          $hairFrontOut.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($finalA, $c.R, $c.G, $c.B))
        }
      }
    }
  }
  $hairFrontOut.Save((Join-Path $layerDir '13_hair_front.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $hairFrontOut.Dispose()

  # 6. Clean Continuous Under-Paint on 04_face_head.png (true shaded sclera + smooth 2D brow/mouth skin!)
  Fill-ScleraNatural $fgHead $src $cfg.eyeL.cx $cfg.eyeL.cy $cfg.eyeL.rx $cfg.eyeL.ry
  Fill-ScleraNatural $fgHead $src $cfg.eyeR.cx $cfg.eyeR.cy $cfg.eyeR.rx $cfg.eyeR.ry
  # Heavy sculptural brow under-paint (wider vertical preference preserves forehead horizontal lines cleanly)
  Inpaint-Ellipse2D $fgHead $cfg.browL.cx $cfg.browL.cy ($cfg.browL.rx - 4) ($cfg.browL.ry - 2) 0.45 0.68
  Inpaint-Ellipse2D $fgHead $cfg.browR.cx $cfg.browR.cy ($cfg.browR.rx - 4) ($cfg.browR.ry - 2) 0.45 0.68
  # Mustache-safe mouth under-paint (only inside lower lip pocket so sweeping mustache above stays 100% crisp!)
  Inpaint-Ellipse2D $fgHead $cfg.mouth.cx ($cfg.mouth.cy + 2) ($cfg.mouth.rx - 8) ($cfg.mouth.ry - 4) 0.42 0.55

  $fgHead.Save((Join-Path $layerDir '04_face_head.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $fgHead.Dispose()
  $src.Dispose()

  Write-Host "Built source_master.png + 13 precision RGBA layers for $($cfg.id)!"
}

# Build Frontier Mendeleev (sci_men_002_frontier) — +42px vertical framing alignment
Build-MendeleevCharacter @{
  id = 'sci_men_002_frontier'
  sourcePath = Join-Path $ROOT 'assets\characters\sci_men_002_frontier\concepts\mendeleev_frontier_bust_concept.jpg'
  shiftY = 42
  bgThresh = 29
  shoulderSplitSy = 315
  bgGlowR = 12; bgGlowG = 14; bgGlowB = 26
  beardCx = 514; beardHalfW = 122; neckShoulderY = 636; beardTipY = 762
  beardLumRefine = $true; beardMinLum = 68
  lashColor = [System.Drawing.Color]::FromArgb(235, 28, 22, 20)
  eyeL  = @{ cx = 442; cy = 383; rx = 33; ry = 10; irisR = 12 }
  eyeR  = @{ cx = 566; cy = 386; rx = 29; ry = 10; irisR = 11 }
  browL = @{ cx = 445; cy = 356; rx = 56; ry = 17 }
  browR = @{ cx = 571; cy = 362; rx = 44; ry = 16 }
  mouth = @{ cx = 516; cy = 535; rx = 48; ry = 15 }
  jaw   = @{ cx = 514; cy = 646; rx = 98; ry = 104 }
  hairRearBoxes = @(
    @{ x0 = 185; y0 = 380; x1 = 336; y1 = 620; cx = 262; cy = 500; rx = 76; ry = 120 },
    @{ x0 = 602; y0 = 395; x1 = 708; y1 = 560; cx = 655; cy = 478; rx = 54; ry = 82 }
  )
  hairFront = @{
    xMin = 190; xMax = 710; yMin = 135; yMax = 535
    faceExcludeCx = 492; faceExcludeCy = 415; faceExcludeRx = 146; faceExcludeRy = 182
    minLum = 78; maxWarmth = 24
  }
}

# Build Institute Mendeleev (sci_men_002_institute) — refined painterly master v3, +40px vertical framing alignment
Build-MendeleevCharacter @{
  id = 'sci_men_002_institute'
  sourcePath = $INST_REFINED_SRC
  shiftY = 40
  bgThresh = 32
  shoulderSplitSy = 330
  bgGlowR = 10; bgGlowG = 22; bgGlowB = 34
  beardCx = 448; beardHalfW = 128; neckShoulderY = 638; beardTipY = 758
  beardLumRefine = $false; beardMinLum = 0
  lashColor = [System.Drawing.Color]::FromArgb(225, 24, 48, 70)
  eyeL  = @{ cx = 377; cy = 392; rx = 34; ry = 10; irisR = 12 }
  eyeR  = @{ cx = 519; cy = 392; rx = 34; ry = 10; irisR = 12 }
  browL = @{ cx = 376; cy = 366; rx = 54; ry = 16 }
  browR = @{ cx = 520; cy = 366; rx = 54; ry = 16 }
  mouth = @{ cx = 448; cy = 552; rx = 48; ry = 14 }
  jaw   = @{ cx = 448; cy = 654; rx = 102; ry = 100 }
  hairRearBoxes = @(
    @{ x0 = 195; y0 = 405; x1 = 304; y1 = 598; cx = 250; cy = 502; rx = 56; ry = 96 },
    @{ x0 = 592; y0 = 405; x1 = 701; y1 = 598; cx = 646; cy = 502; rx = 56; ry = 96 }
  )
  hairFront = @{
    xMin = 195; xMax = 702; yMin = 135; yMax = 535
    faceExcludeCx = 448; faceExcludeCy = 415; faceExcludeRx = 146; faceExcludeRy = 184
    minLum = 100; maxWarmth = 18
  }
}

Write-Host "`nSTAGE 3E.2 MENDELEEV LAYER EXTRACTION COMPLETE!"
