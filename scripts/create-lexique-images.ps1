# Script pour créer les fichiers PNG du lexique

# PNG minimaliste 1x1 blanc (base64)
$png_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
$pngBytes = [System.Convert]::FromBase64String($png_base64)

$baseDir = "C:\axe\faith-flix\public\images\lexique"

# Structure des fichiers à créer
$structure = @{
    "actions" = @("bouton.png", "crud.png", "form.png", "notification.png", "toast.png")
    "admin" = @("dashboard.png")
    "content" = @("card.png", "description.png", "row.png", "soustitre.png", "tableau.png", "titre.png", "vignette.png")
    "interface" = @("banner.png", "checkbox.png", "icones.png", "input.png", "menuderoulant.png", "modal.png", "section.png", "select.png")
    "navigation" = @("footer.png", "header.png", "menu_horizontal.png", "sidebar.png", "user_menu.png")
}

# Créer les fichiers
$createdCount = 0
foreach ($category in $structure.Keys) {
    $categoryPath = Join-Path $baseDir $category
    foreach ($fileName in $structure[$category]) {
        $filePath = Join-Path $categoryPath $fileName
        [IO.File]::WriteAllBytes($filePath, $pngBytes)
        Write-Host "✅ Créé: $($category)/$($fileName)"
        $createdCount++
    }
}

Write-Host ""
Write-Host "✨ Tous les fichiers PNG ont été créés!"
Write-Host "📊 Total: $createdCount fichiers PNG"
Write-Host ""
Write-Host "📁 Structure finale:"
Get-ChildItem -Path $baseDir -Recurse -File | Sort-Object FullName | ForEach-Object {
    $relativePath = $_.FullName -replace [regex]::Escape($baseDir), "lexique"
    Write-Host "   $relativePath"
}
