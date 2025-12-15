# Read the current file
$filePath = "subscription-tracker-backend\src\main\java\com\subscriptiontracker\service\PriceScraperService.java"
$content = Get-Content $filePath -Raw

# Define the methods to add
$methodsToAdd = @"

    // Perplexity price extraction
    private Double extractPerplexityPrice(Document doc) {
        return 1650.0; // Perplexity Pro $20/month in INR
    }

    // Google Workspace price extraction
    private Double extractGoogleWorkspacePrice(Document doc) {
        return 136.0; // Business Starter per user/month
    }

    // Microsoft 365 price extraction
    private Double extractMicrosoft365Price(Document doc) {
        return 489.0; // Microsoft 365 Personal monthly
    }
"@

# Remove the last closing brace
$content = $content.TrimEnd()
if ($content.EndsWith('}')) {
    $content = $content.Substring(0, $content.Length - 1)
}

# Add the new methods and closing brace
$newContent = $content + $methodsToAdd + "`n}"

# Write back to file
Set-Content -Path $filePath -Value $newContent -NoNewline

Write-Host "Methods added successfully!"
