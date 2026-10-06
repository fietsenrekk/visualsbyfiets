# Visuals by Fiets: video pipeline.
# For every catalogue entry it writes three files (skips any that already exist):
#   assets/video/full/<id>.mp4     player: long side <= 1280, <= 30s, sound, capped at 2.4 Mbps (platform-grade, streams on 4G)
#   assets/video/preview/<id>.mp4  grid + carousel loop: long side 480, 6s, silent, tiny
#   assets/img/posters/<id>.webp   first frame of the preview, shown before the loop starts
# and a manifest (assets/video/manifest.json) with each clip's real width/height so the
# layout can reserve space before anything loads (no layout shift).
$ff  = (Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter ffmpeg.exe | Select-Object -First 1).FullName
$fp  = $ff -replace 'ffmpeg.exe$', 'ffprobe.exe'
$tik = "C:\Users\charl\OneDrive\Desktop\glaz\SAINTSTANCE\tiktoks"
$site = $PSScriptRoot

$catalogue = [ordered]@{
  "vbf-intro"          = "VISUALSBYFIETS INTRO FINAL.mp4"
  "vbf-3d"             = "VBF 3DDDD.mp4"
  "central-cee"        = "central cee maka FINALL.mp4"
  "scarface"           = "SCARFACE FINALLLL.mp4"
  "frank-ocean"        = "frank ocean FINAL.mp4"
  "heaven-can-wait"    = "heaven can wait FINAL.mp4"
  "ye-sisters"         = "ye sisters and brothers FINALL.mp4"
  "plot-twist"         = "plot twist finall.mp4"
  "iceman"             = "iceman final.mp4"
  "dust"               = "dust.mp4"
  "time-again"         = "time again finall w audio.mp4"
  "fakemink"           = "FAKEMINK BLOW THE SPEAKER FINAL.mp4"
  "purpose"            = "Purpose General FINAL.mp4"
  "vangogh"            = "vabgogh final.mp4"
  "dangerous-house"    = "dangerous hous finall.mp4"
  "adl-3d"             = "ADL 3D LOGO FINAL TEASER.mp4"
  "bs-on-table"        = "b's on the table final.mp4"
  "precioustrust"      = "precioustrust edit final.mp4"
  "silk-face"          = "silk face yeat.mp4"
  "paranoid"           = "PARANOID YE FINAL.mp4"
  "luh-birk"           = "luh birk FINALLLLL.mp4"
  "holy-water"         = "holy water FINAL.mp4"
  "cocoon"             = "cocoon 3 FINAL.mp4"
  "love-love-it"       = "lovelove it 2.mp4"
  "ran-to-atlanta"     = "iceman turnt.mp4"
  "holy"               = "holy 1.mp4"
  "king"               = "king - ye 2.mp4"
  "saint-pablo"        = "saint pablo FINAL EDIT.mp4"
  "geel"               = "PAARS & GEEL final.mp4"
  "nosebleeds"         = "sso ster final.mp4"
  "about-the-money"    = "about the money_finall.mp4"
  "halftime"           = "halftime youngthug.mp4"
  "thats-how-you-feel" = "thats how you feel_ FINAL.mp4"
  "mm6-supreme"        = "MM6 2026.mp4"
  "spiderman-carti"    = "SPIDERMAN CARTI FINAL.mp4"
  "talk-about-it"      = "talk about it 9ineV.mp4"
  "riri"               = "RIRI FINALL.mp4"
  "dexter"             = "time again dexter.mp4"
  "mah-boi"            = "mah boi updated.mp4"
  "dark-knight"        = "BRUCE WAYNE NEW.mov"
  "stay-up"            = "STAY UP YEAT FINAL.mp4"
  "wegonbeok"          = "wegonbeokay.mp4"
  "renner"             = "RENNER Buffalo FINALL.mp4"
  "ski-edit"           = "Destroy lonely show u how.mp4"
  "ragebait"           = "ragebait saintstation.mp4"
  "night-walk"         = "mirage mm6_1.mp4"
  "malibu"             = "yeat malibu final.mp4"
  "leave-u-out"        = "leave u out 2 dry FINAL.mp4"
  "saintstance-mixed"  = "SAINTSTANCE MASHUP 1_1.mp4"
  "saintstance-2"      = "SAINTSTANCE MASHUP 2.mp4"
  "oblivion"           = "Oblivion.mp4"
  "jack-codeine"       = "JACK CODEINE.mp4"
  "vecna"              = "VECNAAA.mp4"
  "hours-in-silence"   = "HOURSINSILENCE final.mp4"
  "chopper"            = "CHOPPER YT.mp4"
  "blush"              = "Blush.mp4"
  "get-along"          = "get along - ninja edit.mp4"
  "romeyn-de-hooghe"   = "Romeyn de Hooghe finall.mp4"
  "light-trail"        = "IMG_0191.mp4"
  "brands-part-1"      = "Part 1 brandss.mp4"
}

foreach ($d in "assets\video\full", "assets\video\preview", "assets\img\posters") {
  New-Item -ItemType Directory -Force (Join-Path $site $d) | Out-Null
}

$manifest = [ordered]@{}
foreach ($id in $catalogue.Keys) {
  $src = Join-Path $tik $catalogue[$id]
  $full = Join-Path $site "assets\video\full\$id.mp4"
  $prev = Join-Path $site "assets\video\preview\$id.mp4"
  $post = Join-Path $site "assets\img\posters\$id.webp"

  $dur = [double](& $fp -v quiet -show_entries format=duration -of csv=p=0 $src)
  $start = [math]::Round([math]::Max(0, [math]::Min($dur * 0.2, $dur - 6.5)), 2)

  if (-not (Test-Path $full)) {
    & $ff -v error -y -i $src -t 30 `
      -vf "scale=w='min(1280,iw)':h='min(1280,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos" `
      -c:v libx264 -preset medium -crf 23 -maxrate 2400k -bufsize 4800k -pix_fmt yuv420p -movflags +faststart `
      -c:a aac -b:a 128k -ac 2 $full
  }
  if (-not (Test-Path $prev)) {
    & $ff -v error -y -ss $start -i $src -t 6 -an `
      -vf "scale=w='min(480,iw)':h='min(480,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,fps=30" `
      -c:v libx264 -preset slow -crf 29 -pix_fmt yuv420p -g 60 -movflags +faststart $prev
  }
  if (-not (Test-Path $post)) {
    & $ff -v error -y -i $prev -frames:v 1 -c:v libwebp -quality 72 $post
  }

  $wh = (& $fp -v quiet -select_streams v:0 -show_entries stream=width,height -of csv=p=0 $full) -split ','
  $manifest[$id] = @{ w = [int]$wh[0]; h = [int]$wh[1] }
  Write-Output ("DONE {0,-20} {1}x{2}" -f $id, $wh[0], $wh[1])
}

$json = $manifest | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText((Join-Path $site "assets\video\manifest.json"), $json, (New-Object System.Text.UTF8Encoding($false)))
Write-Output "ALL ENCODES COMPLETE"
