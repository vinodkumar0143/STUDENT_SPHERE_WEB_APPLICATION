Add-Type -AssemblyName System.Drawing
$inputFile = "C:\Users\vinod\OneDrive\Desktop\STUDENT_SPHERE_WEB\frontend\assets\logo.png"
$outputFile = "C:\Users\vinod\OneDrive\Desktop\STUDENT_SPHERE_WEB\frontend\assets\logo_transparent.png"
$img = [System.Drawing.Bitmap]::FromFile($inputFile)
$bmp = New-Object System.Drawing.Bitmap($img.Width, $img.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($img, 0, 0, $img.Width, $img.Height)
$img.Dispose()

for ($x = 0; $x -lt $bmp.Width; $x++) {
    for ($y = 0; $y -lt $bmp.Height; $y++) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.R -lt 25 -and $pixel.G -lt 25 -and $pixel.B -lt 25) {
            # Make dark pixels transparent
            $bmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        }
    }
}
$bmp.Save($outputFile, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "Done!"
