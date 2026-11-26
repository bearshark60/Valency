# VALENCY — Stage 3E.2 Full-Resolution Visual QA & Contact Sheet Generator for Dmitri Mendeleev
# Produces:
#   1. assets/characters/<id>/qa/layer_contact_sheet.png (all 13 RGBA layers over magenta/slate checkerboard)
#   2. assets/characters/<id>/qa/reconstruction_and_stress_qa.png (Master vs Neutral Composite vs Stress Test vs 42x42 Mobile Crop)
#   3. assets/characters/<id>/qa/expressions_preview_sheet.png (all 8 expressions rendered from live separated layers + rig_manifest.json)

param(
  [string]$OnlyCharacter = ''
)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$ROOT = 'C:\Users\joshb\.gemini\antigravity\scratch\valency-card-game'

function Draw-Checkerboard($g, [int]$x, [int]$y, [int]$w, [int]$h, [int]$cell = 16) {
  $b1 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 58, 34, 62))
  $b2 = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 34, 42, 58))
  for ($cy = 0; $cy -lt $h; $cy += $cell) {
    for ($cx = 0; $cx -lt $w; $cx += $cell) {
      $br = if ((([int]($cx / $cell) + [int]($cy / $cell)) % 2) -eq 0) { $b1 } else { $b2 }
      $cw = [Math]::Min($cell, $w - $cx)
      $ch = [Math]::Min($cell, $h - $cy)
      $g.FillRectangle($br, $x + $cx, $y + $cy, $cw, $ch)
    }
  }
  $b1.Dispose(); $b2.Dispose()
}

function Composite-ExpressionPose($layers, $manifest, [string]$exprId, [double]$blinkL = 0, [double]$blinkR = 0) {
  $W = 896; $H = 1200
  $bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $e = $manifest.expressions.$exprId
  $pv = $manifest.pivots
  $isFront = ($manifest.aiFamily -eq 'FRONTIER')

  # 1. Background + Rear Hair + Body Clothing
  $g.DrawImage($layers['01_background.png'], 0, 0, $W, $H)
  $g.DrawImage($layers['03_hair_rear.png'], 0, 0, $W, $H)
  $g.DrawImage($layers['02_body_clothing.png'], 0, 0, $W, $H)

  # 2. Head group transform
  $headState = $g.Save()
  $hx = if ($e.headShiftX) { [double]$e.headShiftX } else { 0.0 }
  $hy = if ($e.headShiftY) { [double]$e.headShiftY } else { 0.0 }
  $hrot = if ($e.headTilt) { [double]$e.headTilt } else { 0.0 }
  $g.TranslateTransform([float]$hx, [float]$hy)
  $g.TranslateTransform([float]$pv.head.x, [float]$pv.head.y)
  $g.RotateTransform([float]$hrot)
  $g.TranslateTransform([float](-$pv.head.x), [float](-$pv.head.y))

  # Head base
  $g.DrawImage($layers['04_face_head.png'], 0, 0, $W, $H)

  # Jaw + central beard
  $mOpen = if ($e.mouthOpen) { [double]$e.mouthOpen } else { 0.0 }
  $jawScale = if ($manifest.motionProfile.speakingCadence.jawSpeechScale) { [double]$manifest.motionProfile.speakingCadence.jawSpeechScale } else { 3.4 }
  $baseJawY = if ($e.jawY) { [double]$e.jawY } else { 0.0 }
  $jawY = $baseJawY + $mOpen * $jawScale
  $st = $g.Save()
  $g.TranslateTransform(0, [float]$jawY)
  $g.DrawImage($layers['12_jaw_lower.png'], 0, 0, $W, $H)
  $g.Restore($st)

  # Eyes (clipped to anatomical eye aperture ellipses!)
  $gx = if ($e.gazeBiasX) { [double]$e.gazeBiasX } else { 0.0 }
  $gy = if ($e.gazeBiasY) { [double]$e.gazeBiasY } else { 0.0 }
  $ldx = if ($isFront -and $e.leftEyeDesyncX) { [double]$e.leftEyeDesyncX } else { 0.0 }
  $rdx = if ($isFront -and $e.rightEyeDesyncX) { [double]$e.rightEyeDesyncX } else { 0.0 }
  $rdy = if ($isFront -and $e.rightEyeDesyncY) { [double]$e.rightEyeDesyncY } else { 0.0 }
  $lidUL = if ($null -ne $e.lidUpperLeftOffset) { [double]$e.lidUpperLeftOffset } else { [double]$e.lidUpperOffset }
  $lidUR = if ($null -ne $e.lidUpperRightOffset) { [double]$e.lidUpperRightOffset } else { [double]$e.lidUpperOffset }
  $lidLo = if ($e.lidLowerOffset) { [double]$e.lidLowerOffset } else { 0.0 }

  # Left eye clip
  $st = $g.Save()
  $pL = New-Object System.Drawing.Drawing2D.GraphicsPath
  $pL.AddEllipse([float]($pv.eyeLeft.x - 33), [float]($pv.eyeLeft.y - 10), 66, 20)
  $g.SetClip($pL)
  $g.DrawImage($layers['05_eye_left_iris.png'], [float]($gx + $ldx), [float]$gy, $W, $H)
  $g.DrawImage($layers['07_lid_left_upper.png'], 0, [float]($lidUL + $blinkL * 24.0), $W, $H)
  $loBr = New-Object System.Drawing.SolidBrush($(if ($isFront) { [System.Drawing.Color]::FromArgb(230, 199, 158, 134) } else { [System.Drawing.Color]::FromArgb(230, 199, 213, 222) }))
  $g.FillRectangle($loBr, [float]($pv.eyeLeft.x - 38), [float]($pv.eyeLeft.y + 10 + $lidLo - $blinkL * 4.0), 76, 18)
  $loBr.Dispose(); $pL.Dispose()
  $g.Restore($st)

  # Right eye clip
  $st = $g.Save()
  $pR = New-Object System.Drawing.Drawing2D.GraphicsPath
  $rxR = if ($isFront) { 29 } else { 34 }
  $pR.AddEllipse([float]($pv.eyeRight.x - $rxR), [float]($pv.eyeRight.y - 10), ($rxR * 2), 20)
  $g.SetClip($pR)
  $g.DrawImage($layers['06_eye_right_iris.png'], [float]($gx + $rdx), [float]($gy + $rdy), $W, $H)
  $g.DrawImage($layers['08_lid_right_upper.png'], 0, [float]($lidUR + $blinkR * 24.0), $W, $H)
  $loBr2 = New-Object System.Drawing.SolidBrush($(if ($isFront) { [System.Drawing.Color]::FromArgb(230, 192, 150, 127) } else { [System.Drawing.Color]::FromArgb(230, 199, 213, 222) }))
  $g.FillRectangle($loBr2, [float]($pv.eyeRight.x - 38), [float]($pv.eyeRight.y + 10 + $lidLo - $blinkR * 4.0), 76, 18)
  $loBr2.Dispose(); $pR.Dispose()
  $g.Restore($st)

  # Brows
  $st = $g.Save()
  $g.TranslateTransform(0, [float]$e.browLeftY)
  $g.TranslateTransform([float]$pv.browLeft.x, [float]$pv.browLeft.y)
  $g.RotateTransform([float]$e.browLeftRot)
  $g.TranslateTransform([float](-$pv.browLeft.x), [float](-$pv.browLeft.y))
  $g.DrawImage($layers['09_brow_left.png'], 0, 0, $W, $H)
  $g.Restore($st)

  $st = $g.Save()
  $g.TranslateTransform(0, [float]$e.browRightY)
  $g.TranslateTransform([float]$pv.browRight.x, [float]$pv.browRight.y)
  $g.RotateTransform([float]$e.browRightRot)
  $g.TranslateTransform([float](-$pv.browRight.x), [float](-$pv.browRight.y))
  $g.DrawImage($layers['10_brow_right.png'], 0, 0, $W, $H)
  $g.Restore($st)

  # Mouth + cavity
  $st = $g.Save()
  $msx = if ($e.mouthScaleX) { [double]$e.mouthScaleX } else { 1.0 }
  $baseMsY = if ($e.mouthScaleY) { [double]$e.mouthScaleY } else { 1.0 }
  $msy = $baseMsY + $mOpen * 0.28
  $baseMy = if ($e.mouthY) { [double]$e.mouthY } else { 0.0 }
  $my = $baseMy + $mOpen * 1.5
  $mrot = if ($e.mouthRot) { [double]$e.mouthRot } else { 0.0 }
  $g.TranslateTransform([float]$pv.mouth.x, [float]($pv.mouth.y + $my))
  if ([Math]::Abs($mrot) -gt 0.05) { $g.RotateTransform([float]$mrot) }
  $g.ScaleTransform([float]$msx, [float]$msy)
  $g.TranslateTransform([float](-$pv.mouth.x), [float](-$pv.mouth.y))
  if ($mOpen -gt 0.03) {
    $cavA = [int][Math]::Min(235, $mOpen * 380)
    $cavBr = New-Object System.Drawing.SolidBrush($(if ($isFront) { [System.Drawing.Color]::FromArgb($cavA, 44, 22, 20) } else { [System.Drawing.Color]::FromArgb($cavA, 24, 50, 74) }))
    $g.FillEllipse($cavBr, [float]($pv.mouth.x - 28), [float]($pv.mouth.y - 4), 56, 12)
    $cavBr.Dispose()
  }
  $g.DrawImage($layers['11_mouth.png'], 0, 0, $W, $H)
  $g.Restore($st)

  # Front hair
  $g.DrawImage($layers['13_hair_front.png'], 0, 0, $W, $H)

  # Frontier crystalline veins preview during instability / high-tension
  if ($isFront -and $e.seamOpacity -gt 0.20) {
    $va = [int][Math]::Min(230, [double]$e.seamOpacity * 240)
    $penV = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($va, 167, 139, 250), 2.4)
    $penC = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb($va, 125, 211, 252), 1.4)
    $g.DrawLines($penV, @((New-Object System.Drawing.Point(366,282)), (New-Object System.Drawing.Point(356,310)), (New-Object System.Drawing.Point(374,336)), (New-Object System.Drawing.Point(376,356))))
    $g.DrawLines($penV, @((New-Object System.Drawing.Point(332,530)), (New-Object System.Drawing.Point(348,566)), (New-Object System.Drawing.Point(342,596))))
    $g.DrawLines($penC, @((New-Object System.Drawing.Point(358,556)), (New-Object System.Drawing.Point(348,566)), (New-Object System.Drawing.Point(366,600))))
    $penV.Dispose(); $penC.Dispose()
  }

  $g.Restore($headState)

  # Frontier instability telemetry bracket overlay
  if ($isFront -and $exprId -eq 'instability') {
    $penB = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(190, 56, 189, 248), 1.8)
    $g.DrawRectangle($penB, 612, 318, 166, 92)
    $g.DrawLine($penB, 667, 318, 667, 410)
    $g.DrawLine($penB, 722, 318, 722, 410)
    $g.DrawLine($penB, 612, 364, 778, 364)
    $fT = New-Object System.Drawing.Font('Consolas', 12, [System.Drawing.FontStyle]::Bold)
    $bT = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 224, 242, 254))
    $g.DrawString('[?]', $fT, $bT, 678, 376)
    $g.DrawString('EKA-SYNC // GRP.IV', $fT, $bT, 612, 298)
    $fT.Dispose(); $bT.Dispose(); $penB.Dispose()
  }

  $g.Dispose()
  return $bmp
}

function Render-CharacterQA([string]$charId) {
  Write-Host "=== Rendering Stage 3E.2 QA Sheets for $charId ==="
  $charDir = Join-Path $ROOT "assets\characters\$charId"
  $layerDir = Join-Path $charDir 'layers'
  $qaDir = Join-Path $charDir 'qa'
  New-Item -ItemType Directory -Path $qaDir -Force | Out-Null

  $manifest = Get-Content (Join-Path $charDir 'rig_manifest.json') -Raw | ConvertFrom-Json
  $master = [System.Drawing.Bitmap]::FromFile((Join-Path $charDir 'production\source_master.png'))

  $layerNames = @(
    '01_background.png','02_body_clothing.png','03_hair_rear.png','04_face_head.png',
    '05_eye_left_iris.png','06_eye_right_iris.png','07_lid_left_upper.png','08_lid_right_upper.png',
    '09_brow_left.png','10_brow_right.png','11_mouth.png','12_jaw_lower.png','13_hair_front.png'
  )
  $layers = @{}
  foreach ($ln in $layerNames) {
    $layers[$ln] = [System.Drawing.Bitmap]::FromFile((Join-Path $layerDir $ln))
  }

  # 1. Layer Contact Sheet (5 columns x 3 rows on magenta/slate checkerboard)
  $cw = 280; $ch = 375; $pad = 14; $hdr = 24
  $cols = 5; $rows = 3
  $csW = $cols * ($cw + $pad) + $pad
  $csH = $rows * ($ch + $hdr + $pad) + $pad + 34
  $cs = New-Object System.Drawing.Bitmap($csW, $csH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($cs)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 11, 17, 29))
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $fTitle = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
  $fLbl = New-Object System.Drawing.Font('Consolas', 8.5, [System.Drawing.FontStyle]::Bold)
  $bWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 226, 232, 240))
  $g.DrawString("STAGE 3E.2 LAYER INSPECTION SHEET — $charId (13 RGBA Layers on Checkerboard)", $fTitle, $bWhite, 14, 8)

  for ($i = 0; $i -lt $layerNames.Count; $i++) {
    $ln = $layerNames[$i]
    $col = $i % $cols; $row = [int][Math]::Floor($i / $cols)
    $px = $pad + $col * ($cw + $pad)
    $py = 38 + $pad + $row * ($ch + $hdr + $pad)
    Draw-Checkerboard $g $px ($py + $hdr) $cw $ch 14
    $g.DrawImage($layers[$ln], $px, ($py + $hdr), $cw, $ch)
    $g.DrawString($ln, $fLbl, $bWhite, $px, $py + 4)
  }
  $cs.Save((Join-Path $qaDir 'layer_contact_sheet.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $cs.Dispose()

  # 2. Reconstruction & Stress Test + 42x42 Mobile Readability Sheet
  $neutralComp = Composite-ExpressionPose $layers $manifest 'neutral' 0 0
  $stressComp = Composite-ExpressionPose $layers $manifest 'explaining' 0.55 0.55
  $irritatedComp = Composite-ExpressionPose $layers $manifest 'irritated' 0 0

  # Compute exact mean absolute RGB reconstruction diff between master and neutral composite (inside foreground)
  $diffSum = 0.0; $diffN = 0
  for ($y = 140; $y -lt 1160; $y += 4) {
    for ($x = 120; $x -lt 780; $x += 4) {
      $c1 = $master.GetPixel($x, $y)
      $c2 = $neutralComp.GetPixel($x, $y)
      $diffSum += ([Math]::Abs($c1.R - $c2.R) + [Math]::Abs($c1.G - $c2.G) + [Math]::Abs($c1.B - $c2.B)) / 3.0
      $diffN++
    }
  }
  $mae = [Math]::Round($diffSum / [Math]::Max(1, $diffN), 2)
  Write-Host "  $charId Master vs Neutral Composite MAE (foreground ROI): $mae / 255"

  $pw = 420; $ph = 562
  $rsW = $pw * 3 + 48 + 260
  $rsH = $ph + 72
  $rs = New-Object System.Drawing.Bitmap($rsW, $rsH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($rs)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 15, 26))
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.DrawString("STAGE 3E.2 RECONSTRUCTION, ARTICULATION STRESS & 42x42 MOBILE QA — $charId (FG MAE: $mae)", $fTitle, $bWhite, 14, 10)

  $g.DrawString('1. Source Master (896x1200)', $fLbl, $bWhite, 12, 42)
  $g.DrawImage($master, 12, 62, $pw, $ph)

  $g.DrawString('2. Assembled 13-Layer Neutral', $fLbl, $bWhite, 24 + $pw, 42)
  $g.DrawImage($neutralComp, 24 + $pw, 62, $pw, $ph)

  $g.DrawString('3. Explaining + 55% Blink + Jaw Drop', $fLbl, $bWhite, 36 + $pw * 2, 42)
  $g.DrawImage($stressComp, 36 + $pw * 2, 62, $pw, $ph)

  # Panel 4: Mobile 42x42 circular battle crop simulation (matching .v-portrait-mini scale(2.05) transform-origin 50% 34%)
  $mx = 48 + $pw * 3
  $g.DrawString('4. Mobile 42x42 Circular', $fLbl, $bWhite, $mx, 42)
  $cropSrc = New-Object System.Drawing.Rectangle(229, 175, 438, 438)
  $poses = @(
    @{ lbl = 'Neutral (42px + 4x)'; img = $neutralComp; y = 78 },
    @{ lbl = 'Irritated (42px + 4x)'; img = $irritatedComp; y = 266 },
    @{ lbl = 'Explaining (42px + 4x)'; img = $stressComp; y = 454 }
  )
  foreach ($item in $poses) {
    $g.DrawString($item.lbl, $fLbl, $bWhite, $mx, $item.y - 18)
    $y42 = [int]($item.y + 42)
    $mx2 = [int]($mx + 62)
    $iy = [int]$item.y
    # 1:1 true 42x42 circular crop
    $st = $g.Save()
    $cp1 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $cp1.AddEllipse($mx, $y42, 42, 42)
    $g.SetClip($cp1)
    $g.DrawImage($item.img, (New-Object System.Drawing.Rectangle($mx, $y42, 42, 42)), $cropSrc, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Restore($st)
    $penRing = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 56, 189, 248), 1.5)
    $g.DrawEllipse($penRing, $mx, $y42, 42, 42)
    # 3.4x magnified inspection (144x144)
    $st = $g.Save()
    $cp2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $cp2.AddEllipse($mx2, $iy, 144, 144)
    $g.SetClip($cp2)
    $g.DrawImage($item.img, (New-Object System.Drawing.Rectangle($mx2, $iy, 144, 144)), $cropSrc, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Restore($st)
    $g.DrawEllipse($penRing, $mx2, $iy, 144, 144)
    $penRing.Dispose(); $cp1.Dispose(); $cp2.Dispose()
  }

  $rs.Save((Join-Path $qaDir 'reconstruction_and_stress_qa.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $rs.Dispose()

  # 3. All 8 Expressions Preview Sheet (4x2 grid)
  $exprIds = @('neutral','thoughtful','amused','explaining','concerned','disappointed','irritated','instability')
  $ew = 310; $eh = 415
  $esW = 4 * ($ew + 12) + 12
  $esH = 2 * ($eh + 28 + 12) + 48
  $es = New-Object System.Drawing.Bitmap($esW, $esH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($es)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 10, 15, 26))
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawString("STAGE 3E.2 8-EXPRESSION ASSEMBLED RIG PREVIEW — $charId", $fTitle, $bWhite, 12, 10)

  for ($i = 0; $i -lt $exprIds.Count; $i++) {
    $eid = $exprIds[$i]
    $col = $i % 4; $row = [int][Math]::Floor($i / 4)
    $px = 12 + $col * ($ew + 12)
    $py = 44 + $row * ($eh + 28 + 12)
    $rendered = Composite-ExpressionPose $layers $manifest $eid 0 0
    $lbl = "$($eid.ToUpper()) — $($manifest.expressions.$eid.label)"
    $g.DrawString($lbl, $fLbl, $bWhite, $px, $py + 4)
    $g.DrawImage($rendered, $px, $py + 24, $ew, $eh)
    $rendered.Dispose()
  }
  $es.Save((Join-Path $qaDir 'expressions_preview_sheet.png'), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $es.Dispose()

  $neutralComp.Dispose(); $stressComp.Dispose(); $irritatedComp.Dispose()
  $fTitle.Dispose(); $fLbl.Dispose(); $bWhite.Dispose()
  $master.Dispose()
  foreach ($k in $layers.Keys) { $layers[$k].Dispose() }
}

if (-not $OnlyCharacter -or $OnlyCharacter -eq 'sci_men_002_frontier') {
  Render-CharacterQA 'sci_men_002_frontier'
}
if (-not $OnlyCharacter -or $OnlyCharacter -eq 'sci_men_002_institute') {
  Render-CharacterQA 'sci_men_002_institute'
}
Write-Host "`nALL STAGE 3E.2 VISUAL QA SHEETS RENDERED!"
