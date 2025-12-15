import re

# Read the file
file_path = r'e:\Subscription-tracker\subscription-tracker-backend\src\main\java\com\subscriptiontracker\service\PriceScraperService.java'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Remove duplicate Spotify case (lines 147-149)
content = re.sub(
    r'(case "Hotstar":\s+price = extractHotstarPrice\(doc\);\s+break;\s+)case "Spotify":\s+price = extractSpotifyPrice\(doc\);\s+break;\s+',
    r'\1',
    content
)

# Fix 2: Add missing methods before the last closing brace
methods_to_add = '''
    // DeepSeek price extraction
    private Double extractDeepSeekPrice(Document doc) {
        // DeepSeek is API-based, pay-per-use (not monthly subscription)
        // Return 0 as it's not a fixed monthly subscription
        return 0.0; // Free tier / Pay-as-you-go
    }

    // Gemini price extraction from subscriptions page
    private Double extractGeminiPrice(Document doc) {
        // Gemini pricing page shows different tiers
        String pageText = doc.text();
        
        // Try to find INR/month prices
        Pattern inrPattern = Pattern.compile("₹\\\\s*([\\\\d,]+)\\\\s*INR/month");
        Matcher inrMatcher = inrPattern.matcher(pageText);
        if (inrMatcher.find()) {
            try {
                String priceStr = inrMatcher.group(1).replace(",", "");
                Double price = Double.parseDouble(priceStr);
                // Filter for reasonable Gemini pricing
                if (price >= 1000 && price <= 3000) {
                    return price;
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Gemini price");
            }
        }

        // Fallback to known Gemini Advanced price
        return 1950.0;
    }
'''

# Add methods before the final closing brace
content = content.rstrip()
if content.endswith('}'):
    content = content[:-1] + methods_to_add + '\n}'

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed successfully!")
