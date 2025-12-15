package com.subscriptiontracker.service;

import com.subscriptiontracker.entity.PriceHistory;
import com.subscriptiontracker.entity.Subscription;
import com.subscriptiontracker.entity.User;
import com.subscriptiontracker.entity.Watchlist;
import com.subscriptiontracker.repository.PriceHistoryRepository;
import com.subscriptiontracker.repository.SubscriptionRepository;
import com.subscriptiontracker.repository.WatchlistRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PriceScraperService {

    private static final Logger logger = LoggerFactory.getLogger(PriceScraperService.class);

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private PriceHistoryRepository priceHistoryRepository;

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private AlertService alertService;

    // Map of subscription names to their pricing page URLs
    private static final Map<String, String> SUBSCRIPTION_URLS = new HashMap<>();

    static {
        // Updated URLs to help pages which are more stable for scraping
        SUBSCRIPTION_URLS.put("Netflix", "https://help.netflix.com/en/node/24926");
        SUBSCRIPTION_URLS.put("Amazon Prime",
                "https://www.amazon.in/gp/help/customer/display.html?nodeId=G34EUPKVMYFW8N2U");
        SUBSCRIPTION_URLS.put("Hotstar",
                "https://help.hotstar.com/in/en/support/solutions/articles/68000001237-disney+-hotstar-subscription-plans");
        SUBSCRIPTION_URLS.put("Spotify", "https://www.spotify.com/in-en/premium/");
        SUBSCRIPTION_URLS.put("DeepSeek", "https://api-docs.deepseek.com/quick_start/pricing");
        SUBSCRIPTION_URLS.put("Gemini", "https://gemini.google/subscriptions/");
        SUBSCRIPTION_URLS.put("Perplexity", "https://www.perplexity.ai/enterprise/pricing");
        SUBSCRIPTION_URLS.put("Google Workspace", "https://workspace.google.com/pricing.html");
        SUBSCRIPTION_URLS.put("Microsoft 365", "https://www.microsoft.com/en-in/microsoft-365");
        // Add more as needed
    }

    // Scrape all subscription prices
    @Transactional
    public void scrapeAllPrices() {
        logger.info("Starting price scraping for all subscriptions...");

        List<Subscription> subscriptions = subscriptionRepository.findAll();

        for (Subscription subscription : subscriptions) {
            try {
                scrapeSubscriptionPrice(subscription);
            } catch (Exception e) {
                logger.error("Error scraping price for {}: {}", subscription.getName(), e.getMessage());
            }
        }

        logger.info("Price scraping completed.");
    }

    // Scrape price for a specific subscription
    @Transactional
    public void scrapeSubscriptionPrice(Subscription subscription) {
        String url = SUBSCRIPTION_URLS.get(subscription.getName());

        if (url == null) {
            logger.warn("No URL configured for subscription: {}", subscription.getName());
            return;
        }

        try {
            logger.info("Scraping price for: {}", subscription.getName());

            // Connect to the website with timeout and user-agent
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(10000)
                    .get();

            // Extract price based on subscription name
            Double newMonthlyPrice = extractPrice(doc, subscription.getName());

            if (newMonthlyPrice != null) {
                // Check if price has changed
                Double oldPrice = subscription.getPriceMonthly();

                if (oldPrice != null && !oldPrice.equals(newMonthlyPrice)) {
                    // Price has changed - save to history
                    savePriceHistory(subscription, oldPrice, subscription.getPriceYearly());

                    // Check if price dropped and notify watchlist users
                    if (newMonthlyPrice < oldPrice) {
                        notifyPriceDrop(subscription, oldPrice, newMonthlyPrice);
                    }
                }

                // Update subscription price
                subscription.setPriceMonthly(newMonthlyPrice);
                subscription.setLastScrapedAt(LocalDateTime.now());
                subscriptionRepository.save(subscription);

                logger.info("Updated {} price to ₹{}", subscription.getName(), newMonthlyPrice);
            }

        } catch (IOException e) {
            logger.error("Failed to scrape {}: {}", subscription.getName(), e.getMessage());
        }
    }

    // Extract price from HTML document
    private Double extractPrice(Document doc, String subscriptionName) {
        Double price = null;

        try {
            switch (subscriptionName) {
                case "Netflix":
                    price = extractNetflixPrice(doc);
                    break;
                case "Spotify":
                    price = extractSpotifyPrice(doc);
                    break;
                case "Amazon Prime":
                    price = extractAmazonPrimePrice(doc);
                    break;
                case "Hotstar":
                    price = extractHotstarPrice(doc);
                    break;
                case "DeepSeek":
                    price = extractDeepSeekPrice(doc);
                    break;
                case "Gemini":
                    price = extractGeminiPrice(doc);
                    break;
                case "Perplexity":
                    price = extractPerplexityPrice(doc);
                    break;
                case "Google Workspace":
                    price = extractGoogleWorkspacePrice(doc);
                    break;
                case "Microsoft 365":
                    price = extractMicrosoft365Price(doc);
                    break;
                default:
                    price = extractGenericPrice(doc);
            }
        } catch (Exception e) {
            logger.error("Error extracting price for {}: {}", subscriptionName, e.getMessage());
        }

        return price;
    }

    // Netflix price extraction from help page
    private Double extractNetflixPrice(Document doc) {
        // Netflix help page has pricing in structured format
        // Look for "Mobile" plan first (cheapest), then Basic
        String pageText = doc.text();

        // Try to find Mobile plan price: "Mobile: ₹149 INR/month" or "Mobile ₹149"
        Pattern mobilePattern = Pattern.compile("Mobile[:\\s]+₹\\s*(\\d+)\\s*INR");
        Matcher mobileMatcher = mobilePattern.matcher(pageText);
        if (mobileMatcher.find()) {
            try {
                return Double.parseDouble(mobileMatcher.group(1));
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Netflix Mobile price");
            }
        }

        // Try Basic plan: "Basic: ₹199 INR/month"
        Pattern basicPattern = Pattern.compile("Basic[:\\s]+₹\\s*(\\d+)\\s*INR");
        Matcher basicMatcher = basicPattern.matcher(pageText);
        if (basicMatcher.find()) {
            try {
                return Double.parseDouble(basicMatcher.group(1));
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Netflix Basic price");
            }
        }

        // Fallback to known Basic price
        return 199.0;
    }

    // Spotify price extraction
    private Double extractSpotifyPrice(Document doc) {
        Elements priceElements = doc.select("[class*='price'], .sc-1dqy6lx-0");

        for (Element element : priceElements) {
            String text = element.text();
            Double price = parsePrice(text);
            if (price != null && price > 0) {
                return price;
            }
        }

        return 119.0; // Spotify Individual plan price in INR
    }

    // Amazon Prime price extraction from help page
    private Double extractAmazonPrimePrice(Document doc) {
        // Amazon Prime help page has pricing in table format
        // Look for "Monthly Prime" row with price
        String pageText = doc.text();

        // Try to find Monthly Prime price: "Monthly Prime (1 month) ₹ 299"
        Pattern monthlyPattern = Pattern.compile("Monthly Prime.*?₹\\s*(\\d+)");
        Matcher monthlyMatcher = monthlyPattern.matcher(pageText);
        if (monthlyMatcher.find()) {
            try {
                return Double.parseDouble(monthlyMatcher.group(1));
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Amazon Prime monthly price");
            }
        }

        // Alternative pattern: just "299" after "Monthly"
        Pattern altPattern = Pattern.compile("Monthly.*?(\\d{3})");
        Matcher altMatcher = altPattern.matcher(pageText);
        if (altMatcher.find()) {
            try {
                Double price = Double.parseDouble(altMatcher.group(1));
                if (price >= 100 && price <= 1000) { // Sanity check
                    return price;
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Amazon Price alternative pattern");
            }
        }

        // Fallback to known monthly price
        return 299.0;
    }

    // Hotstar price extraction from help page
    private Double extractHotstarPrice(Document doc) {
        // Hotstar help page has clear pricing information
        // Look for Mobile, Super, or Premium plan pricing
        String pageText = doc.text();

        // Try to find Mobile plan: "Mobile (Ad-Supported plan) - Rs 149 / 3 months"
        Pattern mobilePattern = Pattern.compile("Mobile.*?Rs\\s*(\\d+)\\s*/\\s*3\\s*months");
        Matcher mobileMatcher = mobilePattern.matcher(pageText);
        if (mobileMatcher.find()) {
            try {
                // Convert 3-month price to monthly
                Double threeMonthPrice = Double.parseDouble(mobileMatcher.group(1));
                return Math.round(threeMonthPrice / 3.0 * 100.0) / 100.0; // ₹149/3 = ₹49.67/month
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Hotstar Mobile price");
            }
        }

        // Try Super plan: "Super (Ad-Supported plan)** - Rs 299 / 3 months"
        Pattern superPattern = Pattern.compile("Super.*?Rs\\s*(\\d+)\\s*/\\s*3\\s*months");
        Matcher superMatcher = superPattern.matcher(pageText);
        if (superMatcher.find()) {
            try {
                Double threeMonthPrice = Double.parseDouble(superMatcher.group(1));
                return Math.round(threeMonthPrice / 3.0 * 100.0) / 100.0; // ₹299/3 = ₹99.67/month
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Hotstar Super price");
            }
        }

        // Try Premium plan monthly: "Premium (Ad-Free plan) - Rs 299 / month"
        Pattern premiumPattern = Pattern.compile("Premium.*?Rs\\s*(\\d+)\\s*/\\s*month");
        Matcher premiumMatcher = premiumPattern.matcher(pageText);
        if (premiumMatcher.find()) {
            try {
                return Double.parseDouble(premiumMatcher.group(1));
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Hotstar Premium price");
            }
        }

        // Fallback to known Mobile plan monthly equivalent
        return 49.67; // Mobile plan ₹149/3 months
    }

    // DeepSeek price extraction
    private Double extractDeepSeekPrice(Document doc) {
        // DeepSeek is API-based, pay-per-use (not monthly subscription)
        // Pricing is per 1M tokens: $0.28 input, $0.42 output
        // Return 0 as it's not a fixed monthly subscription
        return 0.0; // Free tier / Pay-as-you-go
    }

    // Gemini price extraction from subscriptions page
    private Double extractGeminiPrice(Document doc) {
        // Gemini pricing page shows different tiers
        String pageText = doc.text();

        // Try to find INR/month prices
        Pattern inrPattern = Pattern.compile("₹\\s*([\\d,]+)\\s*INR/month");
        Matcher inrMatcher = inrPattern.matcher(pageText);
        if (inrMatcher.find()) {
            try {
                String priceStr = inrMatcher.group(1).replace(",", "");
                Double price = Double.parseDouble(priceStr);
                // Filter for reasonable Gemini pricing (₹1000-₹3000)
                if (price >= 1000 && price <= 3000) {
                    return price;
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Gemini price");
            }
        }

        // Fallback to known Gemini Advanced price
        return 1950.0; // Google One AI Premium (Gemini Advanced)
    }

    // Generic price extraction
    private Double extractGenericPrice(Document doc) {
        // Look for common price patterns
        Elements priceElements = doc.select("[class*='price'], [class*='cost'], [class*='amount']");

        for (Element element : priceElements) {
            String text = element.text();
            Double price = parsePrice(text);
            if (price != null && price > 0) {
                return price;
            }
        }

        return null;
    }

    // Parse price from text (e.g., "₹199/month" -> 199.0)
    private Double parsePrice(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }

        // Pattern to match Indian Rupee prices
        Pattern pattern = Pattern.compile("₹\\s*([\\d,]+(?:\\.\\d{2})?)");
        Matcher matcher = pattern.matcher(text);

        if (matcher.find()) {
            String priceStr = matcher.group(1).replace(",", "");
            try {
                return Double.parseDouble(priceStr);
            } catch (NumberFormatException e) {
                return null;
            }
        }

        // Try without rupee symbol
        Pattern numPattern = Pattern.compile("([\\d,]+(?:\\.\\d{2})?)");
        Matcher numMatcher = numPattern.matcher(text);

        if (numMatcher.find()) {
            String priceStr = numMatcher.group(1).replace(",", "");
            try {
                Double price = Double.parseDouble(priceStr);
                // Filter out unreasonable values
                if (price > 10 && price < 50000) {
                    return price;
                }
            } catch (NumberFormatException e) {
                return null;
            }
        }

        return null;
    }

    // Save price to history
    @Transactional
    public void savePriceHistory(Subscription subscription, Double monthlyPrice, Double yearlyPrice) {
        PriceHistory priceHistory = PriceHistory.builder()
                .subscription(subscription)
                .priceMonthly(monthlyPrice)
                .priceYearly(yearlyPrice)
                .currency("INR")
                .build();

        priceHistoryRepository.save(priceHistory);
    }

    // Notify users when price drops
    @Transactional
    public void notifyPriceDrop(Subscription subscription, Double oldPrice, Double newPrice) {
        // Find all users who have this in their watchlist with price drop notifications
        // enabled
        List<Watchlist> watchlistItems = watchlistRepository.findAll()
                .stream()
                .filter(w -> w.getSubscription().getId().equals(subscription.getId()))
                .filter(Watchlist::getNotifyOnPriceDrop)
                .toList();

        for (Watchlist item : watchlistItems) {
            // Check if price is below target price (if set)
            if (item.getTargetPrice() == null || newPrice <= item.getTargetPrice()) {
                User user = item.getUser();
                alertService.createPriceDropAlert(user, subscription, oldPrice, newPrice);
                logger.info("Created price drop alert for user {} for {}", user.getEmail(), subscription.getName());
            }
        }
    }
    // Perplexity price extraction
    private Double extractPerplexityPrice(Document doc) {
        String pageText = doc.text();
        
        // Look for "$20" or similar USD pricing per month
        Pattern pricePattern = Pattern.compile("\\$\\s*(\\d+)\\s*/\\s*month");
        Matcher priceMatcher = pricePattern.matcher(pageText);
        if (priceMatcher.find()) {
            try {
                Double usdPrice = Double.parseDouble(priceMatcher.group(1));
                // Convert USD to INR (1 USD ≈ 82.5 INR)
                return usdPrice * 82.5;
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Perplexity price");
            }
        }
        
        return 1650.0; // Fallback: Perplexity Pro $20/month in INR
    }

    // Google Workspace price extraction
    private Double extractGoogleWorkspacePrice(Document doc) {
        String pageText = doc.text();
        
        // Look for Starter plan: "₹160.65" or similar
        Pattern starterPattern = Pattern.compile("Starter.*?₹\\s*([\\d.]+)");
        Matcher starterMatcher = starterPattern.matcher(pageText);
        if (starterMatcher.find()) {
            try {
                return Double.parseDouble(starterMatcher.group(1));
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Google Workspace Starter price");
            }
        }
        
        // Alternative: look for per user/month pricing
        Pattern userPattern = Pattern.compile("₹\\s*([\\d.]+).*?user.*?month");
        Matcher userMatcher = userPattern.matcher(pageText);
        if (userMatcher.find()) {
            try {
                Double price = Double.parseDouble(userMatcher.group(1));
                // Filter for reasonable Workspace pricing (₹100-₹2000)
                if (price >= 100 && price <= 2000) {
                    return price;
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Google Workspace user price");
            }
        }
        
        return 136.0; // Fallback: Business Starter per user/month
    }

    // Microsoft 365 price extraction
    private Double extractMicrosoft365Price(Document doc) {
        String pageText = doc.text();
        
        // Look for Personal plan: "₹489" or "₹489.00"
        Pattern personalPattern = Pattern.compile("Personal.*?₹\\s*([\\d,]+)");
        Matcher personalMatcher = personalPattern.matcher(pageText);
        if (personalMatcher.find()) {
            try {
                String priceStr = personalMatcher.group(1).replace(",", "");
                return Double.parseDouble(priceStr);
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Microsoft 365 Personal price");
            }
        }
        
        // Alternative: Family plan divided by 6 users
        Pattern familyPattern = Pattern.compile("Family.*?₹\\s*([\\d,]+)");
        Matcher familyMatcher = familyPattern.matcher(pageText);
        if (familyMatcher.find()) {
            try {
                String priceStr = familyMatcher.group(1).replace(",", "");
                Double price = Double.parseDouble(priceStr);
                // Family is usually more expensive, divide by 6 users
                if (price > 1000) {
                    return Math.round(price / 6.0 * 100.0) / 100.0;
                }
            } catch (NumberFormatException e) {
                logger.warn("Failed to parse Microsoft 365 Family price");
            }
        }
        
        return 489.0; // Fallback: Microsoft 365 Personal monthly
    }
}
