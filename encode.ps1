$ff = "C:\Users\charl\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe"
$tik = "C:\Users\charl\OneDrive\Desktop\glaz\SAINTSTANCE\tiktoks"
$brands = "C:\Users\charl\OneDrive\Desktop\glaz\SAINTSTANCE\3D OBJ\3D BRANDS"
$site = "C:\Users\charl\claude sites\visualsbyfiets"

# name = output slug, file = source
$work = @(
    @{n="vbf-intro";      f="$tik\VISUALSBYFIETS INTRO FINAL.mp4"},
    @{n="vbf-3d";         f="$tik\VBF 3DDDD.mp4"},
    @{n="central-cee";    f="$tik\central cee maka FINALL.mp4"},
    @{n="scarface";       f="$tik\SCARFACE FINALLLL.mp4"},
    @{n="frank-ocean";    f="$tik\frank ocean FINAL.mp4"},
    @{n="heaven-can-wait";f="$tik\heaven can wait FINAL.mp4"},
    @{n="ye-sisters";     f="$tik\ye sisters and brothers FINALL.mp4"},
    @{n="plot-twist";     f="$tik\plot twist finall.mp4"},
    @{n="iceman";         f="$tik\iceman final.mp4"},
    @{n="dust";           f="$tik\dust.mp4"},
    @{n="time-again";     f="$tik\time again finall w audio.mp4"},
    @{n="fakemink";       f="$tik\FAKEMINK BLOW THE SPEAKER FINAL.mp4"},
    @{n="purpose";        f="$tik\Purpose General FINAL.mp4"},
    @{n="vangogh";        f="$tik\vabgogh final.mp4"},
    @{n="dangerous-house";f="$tik\dangerous hous finall.mp4"},
    @{n="adl-3d";         f="$tik\ADL 3D LOGO FINAL TEASER.mp4"},
    @{n="bs-on-table";    f="$tik\b's on the table final.mp4"},
    @{n="precioustrust";  f="$tik\precioustrust edit final.mp4"}
)

foreach ($v in $work) {
    $out = "$site\assets\video\work\$($v.n).mp4"
    $poster = "$site\assets\img\posters\$($v.n).jpg"
    if (-not (Test-Path $out)) {
        & $ff -y -i $v.f -t 30 -vf "scale='min(720,iw)':-2:flags=lanczos" -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 96k -ac 2 $out 2>$null
    }
    if (-not (Test-Path $poster)) {
        & $ff -y -ss 2 -i $out -frames:v 1 -q:v 4 $poster 2>$null
    }
    Write-Output "DONE work: $($v.n)"
}

Get-ChildItem $brands -Filter *.mp4 | ForEach-Object {
    $slug = ($_.BaseName -replace '[^a-zA-Z0-9]+','-').ToLower().Trim('-')
    $out = "$site\assets\video\brands\$slug.mp4"
    if (-not (Test-Path $out)) {
        & $ff -y -i $_.FullName -t 12 -vf "scale='min(540,iw)':-2:flags=lanczos" -c:v libx264 -preset veryfast -crf 27 -pix_fmt yuv420p -movflags +faststart -an $out 2>$null
    }
    Write-Output "DONE brand: $slug"
}
Write-Output "ALL ENCODES COMPLETE"
