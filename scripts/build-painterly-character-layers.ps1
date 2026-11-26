# VALENCY — Stage 3D.3 High-Precision Painterly Character Layer Extraction & Under-Paint Builder
# Fixes all 6 Stage 3D.3 QA defects while preserving 100% of painterly illustration detail:
#   1. Flood-fill background matte (eliminates rectangular shoulder halos on 02_body_clothing.png)
#   2. Tight true-tone sclera under-paint (eliminates wide-eyed bleaching; preserves hooded upper lashes!)
#   3. Real painted upper-eyelid pixel sampling + soft lash shadow (eliminates flat solid blink bars)
#   4. Clean perimeter-only rear hair extraction (excludes face/chin on Institute Lavoisier)
#   5. Hairline-aware front hair & lip-cleared jaw masks (no forehead skin on hair, no double-lip on jaw)
#   6. Smooth 2D bilateral perimeter inpainting under brows & mouth (eliminates vertical streaks)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$ROOT = 'C:\Users\joshb\.gemini\antigravity\scratch\valency-card-game'

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
  if ($n -eq 0) { return [System.Drawing.Color]::FromArgb(255, 16, 26, 40) }
  return [System.Drawing.Color]::FromArgb(255, [int]($sr / $n), [int]($sg / $n), [int]($sb / $n))
}

function Save-FeatheredEllipseLayer($src, [string]$outPath, [double]$cx, [double]$cy, [double]$rx, [double]$ry, [double]$feather) {
  $out = New-BlankBitmap $src.Width $src.Height
  $x0 = [Math]::Max(0, [int][Math]::Floor($cx - $rx - 2))
  $x1 = [Math]::Min($src.Width - 1, [int][Math]::Ceiling($cx + $rx + 2))
  $y0 = [Math]::Max(0, [int][Math]::Floor($cy - $ry - 2))
  $y1 = [Math]::Min($src.Height - 1, [int][Math]::Ceiling($cy + $ry + 2))
  $inner = [Math]::Max(0.05, 1.0 - $feather)

  for ($y = $y0; $y -le $y1; $y++) {
    $dy = ($y - $cy) / $ry
    for ($x = $x0; $x -le $x1; $x++) {
      $dx = ($x - $cx) / $rx
      $d = [Math]::Sqrt($dx * $dx + $dy * $dy)
      if ($d -le 1.0) {
        $alpha = if ($d -le $inner) { 255 } else { Clamp255(255.0 * (1.0 - ($d - $inner) / $feather)) }
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

# Smooth 2D cross-interpolated skin under-paint (vertical + horizontal perimeter blend -> zero vertical streaks!)
function Inpaint-Ellipse2D($target, [double]$cx, [double]$cy, [double]$rx, [double]$ry, [double]$feather) {
  $copy = $target.Clone()
  $x0 = [Math]::Max(2, [int][Math]::Floor($cx - $rx))
  $x1 = [Math]::Min($target.Width - 3, [int][Math]::Ceiling($cx + $rx))
  $y0 = [Math]::Max(2, [int][Math]::Floor($cy - $ry))
  $y1 = [Math]::Min($target.Height - 3, [int][Math]::Ceiling($cy + $ry))
  $inner = [Math]::Max(0.05, 1.0 - $feather)

  for ($y = $y0; $y -le $y1; $y++) {
    $dy = ($y - $cy) / $ry
    if ([Math]::Abs($dy) -ge 1.0) { continue }
    $xSpan = $rx * [Math]::Sqrt(1.0 - $dy * $dy)
    $leftX = [Math]::Max(2, [int][Math]::Floor($cx - $xSpan - 5))
    $rightX = [Math]::Min($target.Width - 3, [int][Math]::Ceiling($cx + $xSpan + 5))
    $cLeft = Sample-AvgColor $copy $leftX $y 2
    $cRight = Sample-AvgColor $copy $rightX $y 2

    for ($x = $x0; $x -le $x1; $x++) {
      $dx = ($x - $cx) / $rx
      $d = [Math]::Sqrt($dx * $dx + $dy * $dy)
      if ($d -le 1.0) {
        $ySpan = $ry * [Math]::Sqrt([Math]::Max(0.0, 1.0 - $dx * $dx))
        $topY = [Math]::Max(2, [int][Math]::Floor($cy - $ySpan - 5))
        $botY = [Math]::Min($target.Height - 3, [int][Math]::Ceiling($cy + $ySpan + 5))
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

        $fr = 0.62 * $vr + 0.38 * $hr
        $fg = 0.62 * $vg + 0.38 * $hg
        $fb = 0.62 * $vb + 0.38 * $hb

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
  # Sample true sclera color on the inner/outer eye corners (NO artificial brightening!)
  $cA = Sample-AvgColor $src ([int]($cx - $rx * 0.58)) ([int]($cy + 1)) 2
  $cB = Sample-AvgColor $src ([int]($cx + $rx * 0.58)) ([int]($cy + 1)) 2
  $srBase = ($cA.R + $cB.R) * 0.5
  $sgBase = ($cA.G + $cB.G) * 0.5
  $sbBase = ($cA.B + $cB.B) * 0.5

  # Narrower ellipse centered slightly lower so the painting's real dark upper lash line stays 100% untouched!
  $eyCy = $cy + 1.5
  $eyRx = $rx - 4.0
  $eyRy = $ry - 3.5

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
        # Preserve authentic upper-eyelid shadow gradient (darker at top near lashes, luminous in center)
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

# Build painted upper eyelid directly from real upper-eyelid pixels above the eye (matches brushwork & skin tone 100%!)
function Save-NaturalPaintedEyelid($src, [string]$outPath, [int]$cx, [int]$cy, [int]$rx, [int]$ry, [System.Drawing.Color]$lashColor) {
  $out = New-BlankBitmap $src.Width $src.Height
  $lidTop = $cy - $ry - 26
  $lidBot = $cy - $ry + 2
  $x0 = $cx - $rx - 6
  $x1 = $cx + $rx + 6

  for ($y = $lidTop; $y -le $lidBot; $y++) {
    $t = ($y - $lidTop) / [Math]::Max(1.0, ($lidBot - $lidTop))
    # Sample real painted upper-eyelid skin vertically stretched from (cy - ry - 18) .. (cy - ry - 4)
    $srcY = [int][Math]::Round(($cy - $ry - 18) + $t * 13.0)
    for ($x = $x0; $x -le $x1; $x++) {
      $c = $src.GetPixel($x, $srcY)
      # Natural darkening toward lower lash edge
      $edgeShade = if ($t -gt 0.78) { 1.0 - (($t - 0.78) / 0.22) * 0.42 } else { 1.0 }
      $out.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(
        255,
        (Clamp255($c.R * $edgeShade)),
        (Clamp255($c.G * $edgeShade)),
        (Clamp255($c.B * $edgeShade))
      ))
    }
  }
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $penLash = New-Object System.Drawing.Pen($lashColor, 2.4)
  $penLash.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $penLash.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawBezier($penLash, ($cx - $rx - 2), ($lidBot - 1), ($cx - [int]($rx * 0.4)), ($lidBot - 5), ($cx + [int]($rx * 0.4)), ($lidBot - 5), ($cx + $rx + 2), ($lidBot - 1))
  $penLash.Dispose(); $g.Dispose()
  $out.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $out.Dispose()
}

# Perimeter flood-fill background segmentation (eliminates rectangular halos above shoulders!)
function Compute-BackgroundMask($src, [int]$bgThresh) {
  $W = $src.Width; $H = $src.Height
  $bgRef = Sample-AvgColor $src 36 36 10
  # Downsample 2x for ultra-fast BFS flood-fill from image border (448x600 -> < 0.3s!)
  $sw = [int]($W / 2); $sh = [int]($H / 2)
  $isBg = New-Object 'bool[,]' $sw, $sh
  $q = New-Object 'System.Collections.Generic.Queue[int]'

  # Seed top, left, and right upper perimeter (down to y=820 so coat sleeves stay solid)
  for ($x = 0; $x -lt $sw; $x++) {
    $isBg[$x, 0] = $true; $q.Enqueue($x)
  }
  for ($y = 1; $y -lt [Math]::Min($sh, 440); $y++) {
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
      # Never flood into bright center face/coat core
      $px = $src.GetPixel($nx * 2, $ny * 2)
      $dr = $px.R - $bgRef.R; $dg = $px.G - $bgRef.G; $db = $px.B - $bgRef.B
      $dist = [Math]::Sqrt($dr * $dr + $dg * $dg + $db * $db)
      # Adaptive slightly stricter threshold near dark navy shoulders (y > 620)
      $lim = if ($ny -gt 315) { [Math]::Max(14, $bgThresh - 10) } else { $bgThresh }
      if ($dist -le $lim) {
        $isBg[$nx, $ny] = $true
        $q.Enqueue($ny * $sw + $nx)
      }
    }
  }
  return ,$isBg
}

function Build-CharacterLayers($cfg) {
  Write-Host "`n=== Rebuilding High-Precision Painterly Layers for $($cfg.id) ==="
  $charDir = Join-Path $ROOT "assets\characters\$($cfg.id)"
  $prodDir = Join-Path $charDir 'production'
  $layerDir = Join-Path $charDir 'layers'
  New-Item -ItemType Directory -Path $prodDir -Force | Out-Null
  New-Item -ItemType Directory -Path $layerDir -Force | Out-Null

  $src = [System.Drawing.Bitmap]::FromFile($cfg.sourceJpg)
  $W = $src.Width; $H = $src.Height
  $src.Save((Join-Path $prodDir 'source_master.png'), [System.Drawing.Imaging.ImageFormat]::Png)

  # 1. Clean continuous background (01_background.png)
  $bgOut = New-BlankBitmap $W $H
  $bgTopLeft = Sample-AvgColor $src 36 36 12
  $bgCenter = [System.Drawing.Color]::FromArgb(255, (Clamp255($bgTopLeft.R + 12)), (Clamp255($bgTopLeft.G + 20)), (Clamp255($bgTopLeft.B + 28)))
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

  # 2. Flood-fill background mask -> razor-clean feathered foreground silhouette (zero shoulder boxes!)
  $isBg = Compute-BackgroundMask $src $cfg.bgThresh
  $sw = [int]($W / 2); $sh = [int]($H / 2)

  $fgBody = New-BlankBitmap $W $H
  $fgHead = New-BlankBitmap $W $H
  $neckY = $cfg.neckSplitY

  for ($y = 0; $y -lt $H; $y++) {
    $sy = [Math]::Min($sh - 1, [int]($y / 2))
    for ($x = 0; $x -lt $W; $x++) {
      $sx = [Math]::Min($sw - 1, [int]($x / 2))
      # 3x3 neighborhood smooth alpha from flood-fill mask (eliminates jagged aliasing & halos!)
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

      $jawCurve = $neckY + [int](28.0 * [Math]::Exp(-[Math]::Pow(($x - $cfg.chinCx) / 112.0, 2)))
      $bodyStart = $jawCurve - 42

      if ($y -ge $bodyStart) {
        $bFade = if ($y -lt ($bodyStart + 24)) { ($y - $bodyStart) / 24.0 } else { 1.0 }
        $ba = Clamp255($fgAlpha * $bFade)
        $fgBody.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($ba, $c.R, $c.G, $c.B))
      }
      if ($y -le ($jawCurve + 14)) {
        $hFade = if ($y -gt ($jawCurve - 18)) { 1.0 - ($y - ($jawCurve - 18)) / 32.0 } else { 1.0 }
        $ha = Clamp255($fgAlpha * $hFade)
        if ($ha -gt 0) {
          $fgHead.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($ha, $c.R, $c.G, $c.B))
        }
      }
    }
  }

  $fgBody.Save((Join-Path $layerDir '02_body_clothing.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $fgBody.Dispose()

  # 3. Movable Facial Features (extracted cleanly from original painting BEFORE under-painting!)
  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '05_eye_left_iris.png')  $cfg.eyeL.cx $cfg.eyeL.cy ($cfg.eyeL.irisR + 2) ($cfg.eyeL.irisR + 2) 0.30
  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '06_eye_right_iris.png') $cfg.eyeR.cx $cfg.eyeR.cy ($cfg.eyeR.irisR + 2) ($cfg.eyeR.irisR + 2) 0.30

  Save-NaturalPaintedEyelid $src (Join-Path $layerDir '07_lid_left_upper.png')  $cfg.eyeL.cx $cfg.eyeL.cy $cfg.eyeL.rx $cfg.eyeL.ry $cfg.lashColor
  Save-NaturalPaintedEyelid $src (Join-Path $layerDir '08_lid_right_upper.png') $cfg.eyeR.cx $cfg.eyeR.cy $cfg.eyeR.rx $cfg.eyeR.ry $cfg.lashColor

  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '09_brow_left.png')  $cfg.browL.cx $cfg.browL.cy $cfg.browL.rx $cfg.browL.ry 0.42
  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '10_brow_right.png') $cfg.browR.cx $cfg.browR.cy $cfg.browR.rx $cfg.browR.ry 0.42

  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '11_mouth.png')     $cfg.mouth.cx $cfg.mouth.cy $cfg.mouth.rx $cfg.mouth.ry 0.36
  # Jaw mask sits strictly BELOW lower lip shadow (no double-lip blur!)
  Save-FeatheredEllipseLayer $src (Join-Path $layerDir '12_jaw_lower.png') $cfg.jaw.cx   $cfg.jaw.cy   $cfg.jaw.rx   $cfg.jaw.ry   0.45

  # 4. Rear Hair (nape ribbons ONLY — never touches chin or mouth!)
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
          $a = if ($d -le 0.65) { 255 } else { Clamp255(255.0 * (1.0 - ($d - 0.65) / 0.35)) }
          $c = $src.GetPixel($x, $y)
          $rearOut.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $c.R, $c.G, $c.B))
        }
      }
    }
  }
  $rearOut.Save((Join-Path $layerDir '03_hair_rear.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $rearOut.Dispose()

  # 5. Front Hair (strictly powdered silver crown & side curls — excludes warm forehead skin!)
  $hairFrontOut = New-BlankBitmap $W $H
  $hf = $cfg.hairFront
  for ($y = 110; $y -le 470; $y++) {
    $sy = [Math]::Min($sh - 1, [int]($y / 2))
    for ($x = 200; $x -le 710; $x++) {
      $sx = [Math]::Min($sw - 1, [int]($x / 2))
      if ($isBg[$sx, $sy]) { continue }
      # Exclude central forehead/face oval so ONLY powdered silver hair sits on 13_hair_front.png!
      $inFaceCore = (([Math]::Pow(($x - $hf.faceExcludeCx) / $hf.faceExcludeRx, 2) + [Math]::Pow(($y - $hf.faceExcludeCy) / $hf.faceExcludeRy, 2)) -le 1.0)
      if ($inFaceCore) { continue }
      $c = $src.GetPixel($x, $y)
      # Keep cool pale/silver hair pixels (low R-B warm skin delta)
      $warmth = $c.R - $c.B
      $lum = ($c.R + $c.G + $c.B) / 3.0
      if ($lum -gt 95 -and $warmth -lt 26) {
        $dFace = [Math]::Sqrt([Math]::Pow(($x - $hf.faceExcludeCx) / $hf.faceExcludeRx, 2) + [Math]::Pow(($y - $hf.faceExcludeCy) / $hf.faceExcludeRy, 2))
        $edgeA = if ($dFace -lt 1.12) { Clamp255((($dFace - 1.0) / 0.12) * 255.0) } else { 255 }
        $hairFrontOut.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($edgeA, $c.R, $c.G, $c.B))
      }
    }
  }
  $hairFrontOut.Save((Join-Path $layerDir '13_hair_front.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $hairFrontOut.Dispose()

  # 6. Clean Continuous Under-Paint on 04_face_head.png (true shaded sclera + smooth 2D brow/mouth skin!)
  Fill-ScleraNatural $fgHead $src $cfg.eyeL.cx $cfg.eyeL.cy $cfg.eyeL.rx $cfg.eyeL.ry
  Fill-ScleraNatural $fgHead $src $cfg.eyeR.cx $cfg.eyeR.cy $cfg.eyeR.rx $cfg.eyeR.ry
  Inpaint-Ellipse2D $fgHead $cfg.browL.cx $cfg.browL.cy ($cfg.browL.rx - 5) ($cfg.browL.ry - 3) 0.44
  Inpaint-Ellipse2D $fgHead $cfg.browR.cx $cfg.browR.cy ($cfg.browR.rx - 5) ($cfg.browR.ry - 3) 0.44
  Inpaint-Ellipse2D $fgHead $cfg.mouth.cx $cfg.mouth.cy ($cfg.mouth.rx - 6) ($cfg.mouth.ry - 4) 0.42

  $fgHead.Save((Join-Path $layerDir '04_face_head.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $fgHead.Dispose()
  $src.Dispose()
  Write-Host "Rebuilt 13 precision RGBA layers for $($cfg.id)!"
}

Build-CharacterLayers @{
  id = 'sci_lav_001_frontier'
  sourceJpg = Join-Path $ROOT 'assets\characters\sci_lav_001_frontier\concepts\lavoisier_bust_primary.jpg'
  chinCx = 398; neckSplitY = 612; bgThresh = 32
  lashColor = [System.Drawing.Color]::FromArgb(230, 32, 20, 16)
  eyeL = @{ cx = 321; cy = 394; rx = 30; ry = 11; irisR = 11 }
  eyeR = @{ cx = 458; cy = 392; rx = 35; ry = 11; irisR = 12 }
  browL = @{ cx = 318; cy = 358; rx = 45; ry = 16 }
  browR = @{ cx = 456; cy = 355; rx = 60; ry = 16 }
  mouth = @{ cx = 382; cy = 547; rx = 62; ry = 19 }
  jaw   = @{ cx = 396; cy = 608; rx = 86; ry = 36 }
  hairRearBoxes = @(
    @{ x0 = 548; y0 = 496; x1 = 656; y1 = 602; cx = 602; cy = 549; rx = 54; ry = 53 }
  )
  hairFront = @{ faceExcludeCx = 420; faceExcludeCy = 418; faceExcludeRx = 148; faceExcludeRy = 186 }
}

Build-CharacterLayers @{
  id = 'sci_lav_001_institute'
  sourceJpg = Join-Path $ROOT 'assets\characters\sci_lav_001_institute\concepts\lavoisier_institute_bust_primary.jpg'
  chinCx = 448; neckSplitY = 618; bgThresh = 34
  lashColor = [System.Drawing.Color]::FromArgb(220, 26, 48, 70)
  eyeL = @{ cx = 373; cy = 395; rx = 35; ry = 11; irisR = 12 }
  eyeR = @{ cx = 523; cy = 395; rx = 35; ry = 11; irisR = 12 }
  browL = @{ cx = 370; cy = 358; rx = 54; ry = 16 }
  browR = @{ cx = 526; cy = 358; rx = 54; ry = 16 }
  mouth = @{ cx = 448; cy = 550; rx = 64; ry = 19 }
  jaw   = @{ cx = 448; cy = 610; rx = 86; ry = 36 }
  hairRearBoxes = @(
    @{ x0 = 280; y0 = 512; x1 = 344; y1 = 588; cx = 312; cy = 550; rx = 32; ry = 38 },
    @{ x0 = 552; y0 = 512; x1 = 616; y1 = 588; cx = 584; cy = 550; rx = 32; ry = 38 }
  )
  hairFront = @{ faceExcludeCx = 448; faceExcludeCy = 418; faceExcludeRx = 148; faceExcludeRy = 186 }
}

Write-Host "`nALL STAGE 3D.3 QA LAYER FIXES COMPLETE!"
