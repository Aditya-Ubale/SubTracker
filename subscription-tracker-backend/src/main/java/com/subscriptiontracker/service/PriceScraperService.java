package com.subscriptiontracker.service;

import com.subscriptiontracker.entity.PriceHistory;
import com.subscriptiontracker.entity.Subscription;
import com.subscriptiontracker.entity.SubscriptionPlan;
import com.subscriptiontracker.entity.User;
import com.subscriptiontracker.entity.Watchlist;
import com.subscriptiontracker.repository.PriceHistoryRepository;
import com.subscriptiontracker.repository.SubscriptionPlanRepository;
import com.subscriptiontracker.repository.SubscriptionRepository;
import com.subscriptiontracker.repository.WatchlistRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PriceScraperService {

    private static final Logger logger = LoggerFactory.getLogger(PriceScraperService.class);

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @Autowired
    private SubscriptionPlanRepository subscriptionPlanRepository;

    @Autowired
    private PriceHistoryRepository priceHistoryRepository;

    @Autowired
    private WatchlistRepository watchlistRepository;

    @Autowired
    private AlertService alertService;

    // Map of subscription names to their pricing page URLs
    private static final Map<String, String> SUBSCRIPTION_URLS = new HashMap<>();

    static {
        SUBSCRIPTION_URLS.put("Netflix", "https://help.netflix.com/en/node/24926");
        SUBSCRIPTION_URLS.put("Amazon Prime",
                "https://www.amazon.in/gp/help/customer/display.html?nodeId=G34EUPKVMYFW8N2U");
        SUBSCRIPTION_URLS.put("Hotstar",
                "https://help.hotstar.com/in/en/support/solutions/articles/68000001237-disney+-hotstar-subscription-plans");
        SUBSCRIPTION_URLS.put("Spotify", "https://www.spotify.com/in-en/premium/");
        SUBSCRIPTION_URLS.put("DeepSeek", "https://api-docs.deepseek.com/quick_start/pricing");
        SUBSCRIPTION_URLS.put("Gemini", "https://ai.google.dev/pricing");
        SUBSCRIPTION_URLS.put("Perplexity", "https://www.perplexity.ai/pro");
        SUBSCRIPTION_URLS.put("Google Workspace", "https://workspace.google.com/intl/en_in/pricing.html");
        SUBSCRIPTION_URLS.put("Microsoft 365",
                "https://www.microsoft.com/en-in/microsoft-365/compare-all-microsoft-365-products");
    }

    // Inner class to hold scraped plan data
    public static class ScrapedPlan {
        public String planName;
        public Double priceMonthly;
        public Double priceYearly;
        public String videoQuality;
        public Integer maxScreens;
        public Integer downloadDevices;
        public Boolean hasAds;
        public List<String> features;
        public String extraFeatures;
        public String deviceTypes;

        public ScrapedPlan(String planName) {
            this.planName = planName;
            this.features = new ArrayList<>();
            this.hasAds = false;
        }

        @Override
        public String toString() {
            return String.format("Plan[%s: ₹%.0f/month, %s, %d screens]",
                    planName, priceMonthly, videoQuality, maxScreens);
        }
    }

    // Scrape all subscription prices (can be called manually)
    @Transactional
    public void scrapeAllPrices() {
        logger.info("Starting price scraping for all subscriptions...");
        performScraping();
    }

    // Scheduled scraping - runs every 6 hours (at 2 AM, 8 AM, 2 PM, 8 PM)
    @Scheduled(cron = "0 0 2,8,14,20 * * ?")
    @Transactional
    public void scrapeAllPricesScheduled() {
        logger.info("[SCHEDULED] Starting scheduled price scraping at {}", LocalDateTime.now());
        performScraping();
        logger.info("[SCHEDULED] Completed scheduled price scraping at {}", LocalDateTime.now());
    }

    // Internal method to perform the actual scraping
    private void performScraping() {

        List<Subscription> subscriptions = subscriptionRepository.findAll();

        for (Subscription subscription : subscriptions) {
            try {
                scrapeSubscriptionPrice(subscription);
            } catch (Exception e) {
                logger.error("Error scraping price for {}: {}", subscription.getName(), e.getMessage(), e);
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
            logger.info("Scraping price for: {} from {}", subscription.getName(), url);

            // Connect to the website with timeout and user-agent
            Document doc = Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(15000)
                    .followRedirects(true)
                    .get();

            // Extract all plans based on subscription name
            List<ScrapedPlan> scrapedPlans = extractPlans(doc, subscription.getName());

            if (scrapedPlans != null && !scrapedPlans.isEmpty()) {
                logger.info("Found {} plans for {}", scrapedPlans.size(), subscription.getName());

                // Process each scraped plan
                for (ScrapedPlan scrapedPlan : scrapedPlans) {
                    processScrapedPlan(subscription, scrapedPlan);
                }

                // Update subscription's base price to the cheapest plan
                Double cheapestPrice = scrapedPlans.stream()
                        .map(p -> p.priceMonthly)
                        .filter(Objects::nonNull)
                        .min(Double::compareTo)
                        .orElse(null);

                if (cheapestPrice != null) {
                    Double oldPrice = subscription.getPriceMonthly();

                    if (oldPrice != null && !oldPrice.equals(cheapestPrice)) {
                        // Price has changed - save to history
                        savePriceHistory(subscription, oldPrice, subscription.getPriceYearly());

                        // Check if price dropped and notify watchlist users
                        if (cheapestPrice < oldPrice) {
                            notifyPriceDrop(subscription, oldPrice, cheapestPrice);
                        }
                    }

                    subscription.setPriceMonthly(cheapestPrice);
                }

                subscription.setLastScrapedAt(LocalDateTime.now());
                subscriptionRepository.save(subscription);

                logger.info("Successfully updated {} with {} plans", subscription.getName(), scrapedPlans.size());
            } else {
                logger.warn("No plans found for {}", subscription.getName());
            }

        } catch (IOException e) {
            logger.error("Failed to scrape {}: {}", subscription.getName(), e.getMessage());
        }
    }

    // Process a scraped plan and save/update it in the database
    @Transactional
    protected void processScrapedPlan(Subscription subscription, ScrapedPlan scrapedPlan) {
        // Check if this plan already exists
        Optional<SubscriptionPlan> existingPlan = subscriptionPlanRepository
                .findBySubscriptionAndPlanName(subscription, scrapedPlan.planName);

        SubscriptionPlan plan;
        if (existingPlan.isPresent()) {
            plan = existingPlan.get();
            logger.debug("Updating existing plan: {} for {}", scrapedPlan.planName, subscription.getName());
        } else {
            plan = new SubscriptionPlan();
            plan.setSubscription(subscription);
            plan.setPlanName(scrapedPlan.planName);
            logger.debug("Creating new plan: {} for {}", scrapedPlan.planName, subscription.getName());
        }

        // Validate and correct pricing
        Double monthlyPrice = scrapedPlan.priceMonthly;
        Double yearlyPrice = scrapedPlan.priceYearly;

        // If we have yearly but no monthly, calculate monthly as yearly/12
        if (yearlyPrice != null && yearlyPrice > 0 && (monthlyPrice == null || monthlyPrice <= 0)) {
            monthlyPrice = Math.round((yearlyPrice / 12.0) * 100.0) / 100.0;
            logger.debug("Calculated monthly price {} from yearly {} for {}",
                    monthlyPrice, yearlyPrice, scrapedPlan.planName);
        }

        // If we have monthly but no yearly, calculate yearly as monthly*12
        if (monthlyPrice != null && monthlyPrice > 0 && (yearlyPrice == null || yearlyPrice <= 0)) {
            yearlyPrice = monthlyPrice * 12.0;
        }

        // Validate: yearly should be >= monthly*10 (at least ~16% discount is
        // reasonable)
        // If yearly is less than monthly*10, it's likely the monthly equivalent was
        // scraped
        if (monthlyPrice != null && yearlyPrice != null && monthlyPrice > 0) {
            if (yearlyPrice < monthlyPrice) {
                // yearlyPrice is actually monthly equivalent, swap understanding
                // The scraped "yearly" is likely monthly and vice versa
                logger.warn("Price mismatch detected for {}: monthly={}, yearly={}. Yearly < Monthly is invalid.",
                        scrapedPlan.planName, monthlyPrice, yearlyPrice);
                // Don't swap - just recalculate yearly from monthly
                yearlyPrice = monthlyPrice * 12.0;
            } else if (yearlyPrice < monthlyPrice * 10) {
                // Yearly seems like it might be monthly equivalent, not total
                // This means yearly was already the monthly equivalent from yearly billing
                // Keep it as is but set the actual yearly price
                double actualYearly = yearlyPrice * 12.0;
                logger.debug("Yearly {} for {} seems like monthly equivalent. Actual yearly would be {}",
                        yearlyPrice, scrapedPlan.planName, actualYearly);
                yearlyPrice = actualYearly;
            }
        }

        // Update plan details with validated prices
        plan.setPriceMonthly(monthlyPrice);
        plan.setPriceYearly(yearlyPrice);
        plan.setVideoQuality(scrapedPlan.videoQuality);
        plan.setMaxScreens(scrapedPlan.maxScreens);
        plan.setDownloadDevices(scrapedPlan.downloadDevices);
        plan.setHasAds(scrapedPlan.hasAds);
        plan.setFeatures(String.join("|", scrapedPlan.features));
        plan.setExtraFeatures(scrapedPlan.extraFeatures);
        plan.setDeviceTypes(scrapedPlan.deviceTypes);
        plan.setCurrency("INR");
        plan.setIsActive(true);
        plan.setLastScrapedAt(LocalDateTime.now());

        subscriptionPlanRepository.save(plan);
        logger.info("Saved plan: {} - ₹{}/month (₹{}/year) for {}",
                scrapedPlan.planName, monthlyPrice, yearlyPrice, subscription.getName());
    }

    // Extract plans from HTML document based on subscription name
    private List<ScrapedPlan> extractPlans(Document doc, String subscriptionName) {
        List<ScrapedPlan> plans = null;

        try {
            switch (subscriptionName) {
                case "Netflix":
                    plans = extractNetflixPlans(doc);
                    break;
                case "Spotify":
                    plans = extractSpotifyPlans(doc);
                    break;
                case "Amazon Prime":
                    plans = extractAmazonPrimePlans(doc);
                    break;
                case "Hotstar":
                    plans = extractHotstarPlans(doc);
                    break;
                case "DeepSeek":
                    plans = extractDeepSeekPlans(doc);
                    break;
                case "Gemini":
                    plans = extractGeminiPlans(doc);
                    break;
                case "Perplexity":
                    plans = extractPerplexityPlans(doc);
                    break;
                case "Google Workspace":
                    plans = extractGoogleWorkspacePlans(doc);
                    break;
                case "Microsoft 365":
                    plans = extractMicrosoft365Plans(doc);
                    break;
                default:
                    logger.warn("No scraper implemented for: {}", subscriptionName);
            }
        } catch (Exception e) {
            logger.error("Error extracting plans for {}: {}", subscriptionName, e.getMessage(), e);
        }

        return plans;
    }

    // ==================== NETFLIX SCRAPER ====================
    private List<ScrapedPlan> extractNetflixPlans(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();
        Map<String, ScrapedPlan> planMap = new LinkedHashMap<>();

        // Step 1: Extract plan names and features from the table
        Elements tableRows = doc.select("table tr");

        for (Element row : tableRows) {
            Elements cells = row.select("td");
            if (cells.size() >= 2) {
                // First cell contains plan name (in bold)
                Element nameCell = cells.get(0);
                Element boldElement = nameCell
                        .selectFirst("span[style*=font-weight:bold], .doc-editor__marks__bold, strong, b");

                if (boldElement != null) {
                    String planName = boldElement.text().trim();

                    // Skip header row
                    if (planName.equalsIgnoreCase("Netflix Plans")) {
                        continue;
                    }

                    ScrapedPlan plan = new ScrapedPlan(planName);

                    // Second cell contains features list
                    Element featuresCell = cells.get(1);
                    Elements featureItems = featuresCell.select("li");

                    for (Element featureItem : featureItems) {
                        String featureText = featureItem.text().trim();
                        plan.features.add(featureText);

                        // Parse specific features
                        parseNetflixFeature(plan, featureText);
                    }

                    planMap.put(planName, plan);
                    logger.debug("Extracted Netflix plan: {} with {} features", planName, plan.features.size());
                }
            }
        }

        // Step 2: Extract pricing from the pricing section
        // Look for "Pricing" heading and the list that follows
        Elements headings = doc.select("h3, h2, h4");
        for (Element heading : headings) {
            if (heading.text().toLowerCase().contains("pricing")) {
                // Find the next ul element
                Element nextElement = heading.nextElementSibling();
                while (nextElement != null) {
                    if (nextElement.tagName().equalsIgnoreCase("ul")) {
                        Elements priceItems = nextElement.select("li");
                        for (Element priceItem : priceItems) {
                            parsePricingItem(planMap, priceItem.text());
                        }
                        break;
                    } else if (nextElement.tagName().equalsIgnoreCase("div")) {
                        // Price might be inside a div
                        Elements innerList = nextElement.select("ul li");
                        for (Element priceItem : innerList) {
                            parsePricingItem(planMap, priceItem.text());
                        }
                        if (!innerList.isEmpty())
                            break;
                    }
                    nextElement = nextElement.nextElementSibling();
                }
                break;
            }
        }

        // If we couldn't find pricing section, try parsing from page text
        if (planMap.values().stream().allMatch(p -> p.priceMonthly == null)) {
            String pageText = doc.text();

            // Pattern: "Mobile: ₹149 INR/month" or "Mobile ₹149"
            Pattern pricePattern = Pattern.compile("(Mobile|Basic|Standard|Premium)[:\\s]+₹\\s*(\\d+)");
            Matcher matcher = pricePattern.matcher(pageText);

            while (matcher.find()) {
                String planName = matcher.group(1);
                Double price = Double.parseDouble(matcher.group(2));

                if (planMap.containsKey(planName)) {
                    planMap.get(planName).priceMonthly = price;
                } else {
                    ScrapedPlan plan = new ScrapedPlan(planName);
                    plan.priceMonthly = price;
                    planMap.put(planName, plan);
                }
            }
        }

        plans.addAll(planMap.values());

        // Log what we found
        for (ScrapedPlan plan : plans) {
            logger.info("Netflix {}: ₹{}/month, Quality: {}, Screens: {}",
                    plan.planName, plan.priceMonthly, plan.videoQuality, plan.maxScreens);
        }

        return plans;
    }

    // Parse individual Netflix feature text
    private void parseNetflixFeature(ScrapedPlan plan, String featureText) {
        String lowerText = featureText.toLowerCase();

        // Parse video quality
        if (lowerText.contains("480p") || lowerText.contains("sd")) {
            plan.videoQuality = "480p (SD)";
        } else if (lowerText.contains("720p")
                || (lowerText.contains("hd") && !lowerText.contains("full hd") && !lowerText.contains("ultra"))) {
            plan.videoQuality = "720p (HD)";
        } else if (lowerText.contains("1080p") || lowerText.contains("full hd")) {
            plan.videoQuality = "1080p (Full HD)";
        } else if (lowerText.contains("4k") || lowerText.contains("ultra hd")) {
            plan.videoQuality = "4K (Ultra HD)";
            if (lowerText.contains("hdr")) {
                plan.videoQuality += " + HDR";
            }
        }

        // Parse max screens/devices
        Pattern screenPattern = Pattern.compile("watch on (\\d+)");
        Matcher screenMatcher = screenPattern.matcher(lowerText);
        if (screenMatcher.find()) {
            plan.maxScreens = Integer.parseInt(screenMatcher.group(1));
        }

        // Parse download devices
        Pattern downloadPattern = Pattern.compile("download on (\\d+)");
        Matcher downloadMatcher = downloadPattern.matcher(lowerText);
        if (downloadMatcher.find()) {
            plan.downloadDevices = Integer.parseInt(downloadMatcher.group(1));
        }

        // Parse device types
        if (lowerText.contains("phone") || lowerText.contains("tablet")) {
            plan.deviceTypes = "Mobile/Tablet";
        } else if (lowerText.contains("supported device")) {
            plan.deviceTypes = "All Devices";
        }

        // Parse extra features
        if (lowerText.contains("spatial audio")) {
            plan.extraFeatures = (plan.extraFeatures != null ? plan.extraFeatures + ", " : "") + "Spatial Audio";
        }

        // Check for ads
        if (lowerText.contains("ad-free")) {
            plan.hasAds = false;
        } else if (lowerText.contains("with ads") || lowerText.contains("ad-supported")) {
            plan.hasAds = true;
        }
    }

    // Parse pricing item like "Mobile: ₹149 INR/month"
    private void parsePricingItem(Map<String, ScrapedPlan> planMap, String text) {
        // Patterns to try
        Pattern[] patterns = {
                Pattern.compile("(Mobile|Basic|Standard|Premium)[:\\s]*₹\\s*(\\d+(?:,\\d+)?)\\s*(?:INR)?\\s*/\\s*month",
                        Pattern.CASE_INSENSITIVE),
                Pattern.compile("(Mobile|Basic|Standard|Premium)[:\\s]*₹\\s*(\\d+(?:,\\d+)?)",
                        Pattern.CASE_INSENSITIVE),
                Pattern.compile("(Mobile|Basic|Standard|Premium)[^₹]*₹\\s*(\\d+(?:,\\d+)?)", Pattern.CASE_INSENSITIVE)
        };

        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(text);
            if (matcher.find()) {
                String planName = matcher.group(1);
                String priceStr = matcher.group(2).replace(",", "");
                Double price = Double.parseDouble(priceStr);

                // Normalize plan name
                planName = planName.substring(0, 1).toUpperCase() + planName.substring(1).toLowerCase();

                if (planMap.containsKey(planName)) {
                    planMap.get(planName).priceMonthly = price;
                    logger.debug("Parsed Netflix price: {} = ₹{}", planName, price);
                } else {
                    ScrapedPlan plan = new ScrapedPlan(planName);
                    plan.priceMonthly = price;
                    planMap.put(planName, plan);
                    logger.debug("Created new plan with price: {} = ₹{}", planName, price);
                }
                return;
            }
        }
    }

    // ==================== PLACEHOLDER SCRAPERS (to be implemented with HTML)
    // ====================

    private List<ScrapedPlan> extractSpotifyPlans(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();

        try {
            // Find all plan cards - they have data-event-plan-name attribute
            Elements planCards = doc.select("div[data-event-plan-name]");

            logger.info("Found {} Spotify plan cards", planCards.size());

            for (Element planCard : planCards) {
                String planName = planCard.attr("data-event-plan-name");

                if (planName == null || planName.isEmpty()) {
                    continue;
                }

                ScrapedPlan plan = new ScrapedPlan(planName);

                // Extract price - look for the main price element
                // Price format: "₹139 / month" or "₹99 for 3 months"
                Element priceElement = planCard.selectFirst("p.jIMmw, p[class*='jIMmw']");
                if (priceElement != null) {
                    String priceText = priceElement.text().trim();
                    plan.priceMonthly = parseSpotifyPrice(priceText);
                    logger.debug("Found price text: {} -> ₹{}", priceText, plan.priceMonthly);
                }

                // Check for "after" price (regular price after promo)
                // Format: "₹199/month after"
                Element afterPriceElement = planCard.selectFirst("p.oFhpN, p[class*='oFhpN']");
                if (afterPriceElement != null) {
                    String afterText = afterPriceElement.text().trim();
                    Double regularPrice = parseSpotifyPrice(afterText);
                    if (regularPrice != null) {
                        plan.priceMonthly = regularPrice; // Use the regular price, not promo
                        logger.debug("Found regular price: {} -> ₹{}", afterText, regularPrice);
                    }
                }

                // Extract features from list items
                Elements featureItems = planCard.select("ul li p.euprEz, ul li p[class*='euprEz']");
                for (Element featureItem : featureItems) {
                    String featureText = featureItem.text().trim();
                    plan.features.add(featureText);

                    // Parse specific features
                    parseSpotifyFeature(plan, featureText);
                }

                // Set common Spotify properties
                plan.hasAds = false; // All Premium plans are ad-free
                plan.deviceTypes = "All Devices";

                // Only add if we got a valid price
                if (plan.priceMonthly != null && plan.priceMonthly > 0) {
                    plans.add(plan);
                    logger.info("Extracted Spotify plan: {} - ₹{}/month, Audio: {}, Accounts: {}",
                            planName, plan.priceMonthly, plan.videoQuality, plan.maxScreens);
                }
            }

            // If card parsing failed, try text-based extraction as fallback
            if (plans.isEmpty()) {
                plans = extractSpotifyPlansFromText(doc);
            }

        } catch (Exception e) {
            logger.error("Error extracting Spotify plans: {}", e.getMessage(), e);
        }

        return plans;
    }

    // Parse Spotify price from various formats
    private Double parseSpotifyPrice(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }

        // Pattern 1: "₹139 / month" or "₹139/month"
        Pattern monthlyPattern = Pattern.compile("₹\\s*([\\d,]+)\\s*/\\s*month");
        Matcher monthlyMatcher = monthlyPattern.matcher(text);
        if (monthlyMatcher.find()) {
            String priceStr = monthlyMatcher.group(1).replace(",", "");
            return Double.parseDouble(priceStr);
        }

        // Pattern 2: "₹199/month after"
        Pattern afterPattern = Pattern.compile("₹\\s*([\\d,]+)\\s*/month");
        Matcher afterMatcher = afterPattern.matcher(text);
        if (afterMatcher.find()) {
            String priceStr = afterMatcher.group(1).replace(",", "");
            return Double.parseDouble(priceStr);
        }

        // Pattern 3: "₹99 for X months" - calculate monthly
        Pattern promoPattern = Pattern.compile("₹\\s*([\\d,]+)\\s+for\\s+(\\d+)\\s+months?");
        Matcher promoMatcher = promoPattern.matcher(text);
        if (promoMatcher.find()) {
            String priceStr = promoMatcher.group(1).replace(",", "");
            int months = Integer.parseInt(promoMatcher.group(2));
            Double totalPrice = Double.parseDouble(priceStr);
            // Note: This is promo price, we'll use regular price if available
            return Math.round(totalPrice / months * 100.0) / 100.0;
        }

        // Pattern 4: Just "₹139"
        Pattern simplePattern = Pattern.compile("₹\\s*([\\d,]+)");
        Matcher simpleMatcher = simplePattern.matcher(text);
        if (simpleMatcher.find()) {
            String priceStr = simpleMatcher.group(1).replace(",", "");
            return Double.parseDouble(priceStr);
        }

        return null;
    }

    // Parse Spotify feature text to extract plan details
    private void parseSpotifyFeature(ScrapedPlan plan, String featureText) {
        String lower = featureText.toLowerCase();

        // Parse audio quality
        if (lower.contains("lossless") || lower.contains("24-bit")) {
            plan.videoQuality = "Lossless (24-bit/44.1kHz)";
        } else if (lower.contains("very high") || lower.contains("320kbps")) {
            plan.videoQuality = "Very High (~320kbps)";
        } else if (lower.contains("high") || lower.contains("160kbps")) {
            plan.videoQuality = "High (~160kbps)";
        }

        // Parse number of accounts
        Pattern accountPattern = Pattern.compile(
                "(?:up to\\s*)?(\\d+)\\s*(?:lite|standard|platinum|verified)?\\s*accounts?", Pattern.CASE_INSENSITIVE);
        Matcher accountMatcher = accountPattern.matcher(featureText);
        if (accountMatcher.find()) {
            plan.maxScreens = Integer.parseInt(accountMatcher.group(1));
        }

        // Parse specific features
        if (lower.contains("download") && lower.contains("offline")) {
            plan.downloadDevices = 1; // Offline download enabled
        }

        if (lower.contains("ai dj") || lower.contains("ai playlist")) {
            plan.extraFeatures = (plan.extraFeatures != null ? plan.extraFeatures + ", " : "") + "AI Features";
        }

        if (lower.contains("dj software")) {
            plan.extraFeatures = (plan.extraFeatures != null ? plan.extraFeatures + ", " : "") + "DJ Software Support";
        }

        if (lower.contains("mix your playlists")) {
            plan.extraFeatures = (plan.extraFeatures != null ? plan.extraFeatures + ", " : "") + "Playlist Mixing";
        }
    }

    // Fallback: Extract Spotify plans from page text
    private List<ScrapedPlan> extractSpotifyPlansFromText(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();
        String pageText = doc.text();

        // Define plan patterns
        String[][] planData = {
                { "Premium Lite", "Lite.*?₹\\s*([\\d,]+)\\s*/\\s*month", "High (~160kbps)", "1" },
                { "Premium Standard", "Standard.*?₹\\s*([\\d,]+)\\s*/\\s*month", "Very High (~320kbps)", "1" },
                { "Premium Platinum", "Platinum.*?₹\\s*([\\d,]+)\\s*/\\s*month", "Lossless (24-bit)", "3" },
                { "Premium Student", "Student.*?₹\\s*([\\d,]+)\\s*/\\s*month", "Very High (~320kbps)", "1" }
        };

        for (String[] data : planData) {
            Pattern pattern = Pattern.compile(data[1], Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher matcher = pattern.matcher(pageText);

            if (matcher.find()) {
                String priceStr = matcher.group(1).replace(",", "");
                Double price = Double.parseDouble(priceStr);

                ScrapedPlan plan = new ScrapedPlan(data[0]);
                plan.priceMonthly = price;
                plan.videoQuality = data[2];
                plan.maxScreens = Integer.parseInt(data[3]);
                plan.hasAds = false;
                plan.deviceTypes = "All Devices";

                plans.add(plan);
                logger.debug("Extracted from text: {} - ₹{}", data[0], price);
            }
        }

        return plans;
    }

    private List<ScrapedPlan> extractAmazonPrimePlans(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();

        try {
            // Find the table with class "a-bordered" containing pricing info
            Elements tables = doc.select("table.a-bordered");

            for (Element table : tables) {
                Elements rows = table.select("tr");

                for (Element row : rows) {
                    Elements cells = row.select("td");

                    // Skip header row (contains <strong> with "Plan")
                    if (cells.size() >= 2) {
                        String planCell = cells.get(0).text().trim();
                        String priceCell = cells.get(1).text().trim();

                        // Skip if this is the header row
                        if (planCell.equalsIgnoreCase("Plan") || priceCell.toLowerCase().contains("price")) {
                            continue;
                        }

                        // Parse the plan name (e.g., "Monthly Prime (1 month)")
                        String planName = planCell;

                        // Parse the price (e.g., "₹ 299")
                        Double price = parsePriceFromText(priceCell);

                        if (price != null && !planName.isEmpty()) {
                            ScrapedPlan plan = new ScrapedPlan(planName);

                            // Determine duration and calculate monthly price
                            int durationMonths = extractDurationMonths(planName);

                            if (durationMonths == 1) {
                                plan.priceMonthly = price;
                            } else if (durationMonths == 3) {
                                plan.priceMonthly = Math.round(price / 3.0 * 100.0) / 100.0;
                                plan.priceYearly = price * 4; // Extrapolate to yearly
                            } else if (durationMonths == 12) {
                                plan.priceMonthly = Math.round(price / 12.0 * 100.0) / 100.0;
                                plan.priceYearly = price;
                            } else {
                                plan.priceMonthly = price; // Default to as-is
                            }

                            // Set features based on plan type
                            setAmazonPrimeFeatures(plan, planName);

                            plans.add(plan);
                            logger.info("Extracted Amazon Prime plan: {} - ₹{} (₹{}/month)",
                                    planName, price, plan.priceMonthly);
                        }
                    }
                }
            }

            // If table parsing failed, try text-based extraction
            if (plans.isEmpty()) {
                plans = extractAmazonPrimePlansFromText(doc);
            }

        } catch (Exception e) {
            logger.error("Error extracting Amazon Prime plans: {}", e.getMessage(), e);
        }

        return plans;
    }

    // Extract duration in months from plan name
    private int extractDurationMonths(String planName) {
        String lower = planName.toLowerCase();

        if (lower.contains("1 month") || lower.contains("monthly")) {
            return 1;
        } else if (lower.contains("3 month") || lower.contains("quarterly")) {
            return 3;
        } else if (lower.contains("12 month") || lower.contains("annual") || lower.contains("yearly")) {
            return 12;
        }

        // Try to extract number of months using regex
        Pattern monthPattern = Pattern.compile("(\\d+)\\s*month");
        Matcher matcher = monthPattern.matcher(lower);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(1));
        }

        return 1; // Default to monthly
    }

    // Set features for Amazon Prime plans based on plan type
    private void setAmazonPrimeFeatures(ScrapedPlan plan, String planName) {
        String lower = planName.toLowerCase();

        plan.deviceTypes = "All Devices";
        plan.hasAds = false;

        if (lower.contains("lite")) {
            // Prime Lite - limited features
            plan.features.add("Prime Video with ads on Mobile");
            plan.features.add("Ad-free music");
            plan.features.add("Free delivery on eligible orders");
            plan.features.add("Mobile-only video streaming");
            plan.videoQuality = "SD/HD (Mobile only)";
            plan.maxScreens = 1;
            plan.hasAds = true; // Has ads on video
            plan.extraFeatures = "Limited Prime benefits";
        } else if (lower.contains("shopping edition")) {
            // Shopping Edition - shopping benefits only
            plan.features.add("Free delivery on eligible orders");
            plan.features.add("Early access to deals");
            plan.features.add("No Prime Video");
            plan.features.add("No Prime Music");
            plan.videoQuality = "N/A";
            plan.maxScreens = 0;
            plan.extraFeatures = "Shopping benefits only";
        } else {
            // Full Prime (Monthly, Quarterly, Annual)
            plan.features.add("Unlimited ad-free Prime Video streaming");
            plan.features.add("Ad-free Prime Music");
            plan.features.add("Free & fast delivery");
            plan.features.add("Prime Reading");
            plan.features.add("Prime Gaming benefits");
            plan.features.add("Early access to deals");
            plan.videoQuality = "4K Ultra HD";
            plan.maxScreens = 3;
            plan.downloadDevices = 2;
            plan.extraFeatures = "Full Prime benefits";
        }
    }

    // Fallback: Extract plans from page text if table parsing fails
    private List<ScrapedPlan> extractAmazonPrimePlansFromText(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();
        String pageText = doc.text();

        // Patterns for Amazon Prime plans
        String[] planPatterns = {
                "Monthly Prime.*?₹\\s*([\\d,]+)",
                "Quarterly Prime.*?₹\\s*([\\d,]+)",
                "Annual Prime(?!\\s*Lite).*?₹\\s*([\\d,]+)",
                "Annual Prime Lite.*?₹\\s*([\\d,]+)",
                "Prime Shopping Edition.*?₹\\s*([\\d,]+)"
        };

        String[] planNames = {
                "Monthly Prime (1 month)",
                "Quarterly Prime (3 months)",
                "Annual Prime (12 months)",
                "Annual Prime Lite (12 months)",
                "Prime Shopping Edition (12 months)"
        };

        int[] durations = { 1, 3, 12, 12, 12 };

        for (int i = 0; i < planPatterns.length; i++) {
            Pattern pattern = Pattern.compile(planPatterns[i], Pattern.CASE_INSENSITIVE);
            Matcher matcher = pattern.matcher(pageText);

            if (matcher.find()) {
                String priceStr = matcher.group(1).replace(",", "");
                Double price = Double.parseDouble(priceStr);

                ScrapedPlan plan = new ScrapedPlan(planNames[i]);
                plan.priceMonthly = Math.round(price / durations[i] * 100.0) / 100.0;
                if (durations[i] == 12) {
                    plan.priceYearly = price;
                }

                setAmazonPrimeFeatures(plan, planNames[i]);
                plans.add(plan);

                logger.debug("Extracted from text: {} - ₹{}", planNames[i], price);
            }
        }

        return plans;
    }

    // Parse price from text like "₹ 299" or "₹299"
    private Double parsePriceFromText(String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }

        // Pattern to match price with rupee symbol
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

        // Try without rupee symbol - just extract numbers
        Pattern numPattern = Pattern.compile("([\\d,]+(?:\\.\\d{2})?)");
        Matcher numMatcher = numPattern.matcher(text);

        if (numMatcher.find()) {
            String priceStr = numMatcher.group(1).replace(",", "");
            try {
                Double price = Double.parseDouble(priceStr);
                // Sanity check - Amazon Prime prices should be between 100 and 5000
                if (price >= 100 && price <= 5000) {
                    return price;
                }
            } catch (NumberFormatException e) {
                return null;
            }
        }

        return null;
    }

    private List<ScrapedPlan> extractHotstarPlans(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();

        try {
            String pageText = doc.text();

            // Hotstar has text-based plan descriptions in bold
            // Format: "Mobile (Ad-Supported plan) - Rs 149 / 3 months and Rs 499 / year"

            // Plan 1: Mobile (Ad-Supported)
            ScrapedPlan mobilePlan = extractHotstarPlanFromText(pageText,
                    "Mobile",
                    "Mobile\\s*\\(Ad-Supported\\s*plan\\)\\s*-\\s*Rs\\s*([\\d,]+)\\s*/\\s*3\\s*months\\s*and\\s*Rs\\s*([\\d,]+)\\s*/\\s*year",
                    true);
            if (mobilePlan != null) {
                mobilePlan.deviceTypes = "Mobile only";
                mobilePlan.maxScreens = 1;
                mobilePlan.features.add("Access content on 1 mobile device at a time");
                mobilePlan.features.add("Live sports streaming");
                mobilePlan.features.add("Indian movies and shows");
                plans.add(mobilePlan);
            }

            // Plan 2: Super (Ad-Supported)
            ScrapedPlan superPlan = extractHotstarPlanFromText(pageText,
                    "Super",
                    "Super\\s*\\(Ad-Supported\\s*plan\\)\\**\\s*-\\s*Rs\\s*([\\d,]+)\\s*/\\s*3\\s*months\\s*and\\s*Rs\\s*([\\d,]+)\\s*/\\s*year",
                    true);
            if (superPlan != null) {
                superPlan.deviceTypes = "All Devices";
                superPlan.maxScreens = 2;
                superPlan.features.add("Access content on any 2 devices at a time");
                superPlan.features.add("Mobile, Web, and Living Room devices");
                superPlan.features.add("Live sports streaming");
                superPlan.features.add("Disney+, HBO, Paramount+ content");
                plans.add(superPlan);
            }

            // Plan 3: Premium (Ad-Free) - has monthly option
            ScrapedPlan premiumPlan = extractHotstarPremiumPlan(pageText);
            if (premiumPlan != null) {
                plans.add(premiumPlan);
            }

            // If pattern matching failed, try alternative extraction
            if (plans.isEmpty()) {
                plans = extractHotstarPlansAlternative(doc);
            }

            // Log results
            for (ScrapedPlan plan : plans) {
                logger.info("Extracted JioHotstar plan: {} - ₹{}/month, Devices: {}, Ads: {}",
                        plan.planName, plan.priceMonthly, plan.maxScreens, plan.hasAds);
            }

        } catch (Exception e) {
            logger.error("Error extracting Hotstar plans: {}", e.getMessage(), e);
        }

        return plans;
    }

    // Extract Hotstar plan from text using regex pattern
    private ScrapedPlan extractHotstarPlanFromText(String pageText, String planName, String pattern, boolean hasAds) {
        try {
            Pattern pricePattern = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE);
            Matcher matcher = pricePattern.matcher(pageText);

            if (matcher.find()) {
                String threeMonthPriceStr = matcher.group(1).replace(",", "");
                String yearlyPriceStr = matcher.group(2).replace(",", "");

                Double threeMonthPrice = Double.parseDouble(threeMonthPriceStr);
                Double yearlyPrice = Double.parseDouble(yearlyPriceStr);

                ScrapedPlan plan = new ScrapedPlan(planName);

                // Calculate monthly price from 3-month plan
                plan.priceMonthly = Math.round(threeMonthPrice / 3.0 * 100.0) / 100.0;
                plan.priceYearly = yearlyPrice;
                plan.hasAds = hasAds;
                plan.videoQuality = "HD"; // Default HD

                logger.debug("Extracted {} plan: ₹{}/3mo = ₹{}/mo, ₹{}/year",
                        planName, threeMonthPrice, plan.priceMonthly, yearlyPrice);

                return plan;
            }
        } catch (Exception e) {
            logger.warn("Failed to extract {} plan: {}", planName, e.getMessage());
        }

        return null;
    }

    // Extract Hotstar Premium plan (has special format with monthly option)
    private ScrapedPlan extractHotstarPremiumPlan(String pageText) {
        try {
            // Premium has: Rs 299 / month, Rs 499 / 3 months, Rs 1499 / year
            ScrapedPlan plan = new ScrapedPlan("Premium");

            // Try to find monthly price first
            Pattern monthlyPattern = Pattern.compile("Premium\\s*\\(Ad-Free\\s*plan\\).*?Rs\\s*([\\d,]+)\\s*/\\s*month",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher monthlyMatcher = monthlyPattern.matcher(pageText);

            if (monthlyMatcher.find()) {
                String monthlyPriceStr = monthlyMatcher.group(1).replace(",", "");
                plan.priceMonthly = Double.parseDouble(monthlyPriceStr);
            }

            // Try to find yearly price
            Pattern yearlyPattern = Pattern.compile("Rs\\s*([\\d,]+)\\s*/\\s*year.*?(?=Premium|$)",
                    Pattern.CASE_INSENSITIVE);
            // Search after "Premium" keyword for the yearly price
            int premiumIdx = pageText.toLowerCase().indexOf("premium (ad-free");
            if (premiumIdx >= 0) {
                String premiumSection = pageText.substring(premiumIdx, Math.min(premiumIdx + 500, pageText.length()));
                Pattern yearPattern = Pattern.compile("Rs\\s*1499\\s*/\\s*year|Rs\\s*([\\d,]+)\\s*/\\s*year");
                Matcher yearMatcher = yearPattern.matcher(premiumSection);

                if (yearMatcher.find()) {
                    String yearlyPriceStr = yearMatcher.group(0).replaceAll("[^\\d]", "");
                    if (!yearlyPriceStr.isEmpty()) {
                        plan.priceYearly = Double.parseDouble(yearlyPriceStr);
                    }
                }
            }

            // If we couldn't find monthly, calculate from yearly or 3-month
            if (plan.priceMonthly == null && plan.priceYearly != null) {
                plan.priceMonthly = Math.round(plan.priceYearly / 12.0 * 100.0) / 100.0;
            }

            // Set default monthly price if still null
            if (plan.priceMonthly == null) {
                // Try alternative pattern
                Pattern altPattern = Pattern.compile("Premium.*?Rs\\s*299\\s*/\\s*month",
                        Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
                if (altPattern.matcher(pageText).find()) {
                    plan.priceMonthly = 299.0;
                }
            }

            if (plan.priceMonthly != null) {
                plan.hasAds = false; // Ad-free (except LIVE)
                plan.deviceTypes = "All Devices";
                plan.maxScreens = 4;
                plan.videoQuality = "4K"; // Premium typically offers best quality
                plan.features.add("Access content on any 4 devices at a time");
                plan.features.add("Mobile, Web, and Living Room devices");
                plan.features.add("Ad-free entertainment (except LIVE content)");
                plan.features.add("Disney+, HBO, Paramount+ content");
                plan.extraFeatures = "Ad-free except LIVE sports";

                return plan;
            }

        } catch (Exception e) {
            logger.warn("Failed to extract Premium plan: {}", e.getMessage());
        }

        return null;
    }

    // Alternative extraction method for Hotstar
    private List<ScrapedPlan> extractHotstarPlansAlternative(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();

        // Look for bold text elements containing plan info
        Elements boldElements = doc.select("span.doc-editor__marks__bold, strong, b");

        for (Element boldEl : boldElements) {
            String text = boldEl.text().trim();

            // Check for plan headers
            if (text.toLowerCase().contains("mobile") && text.toLowerCase().contains("ad-supported")) {
                // Extract Mobile plan
                ScrapedPlan plan = new ScrapedPlan("Mobile");
                Double[] prices = extractPricesFromText(text);
                if (prices[0] != null) {
                    plan.priceMonthly = prices[0];
                    plan.priceYearly = prices[1];
                    plan.hasAds = true;
                    plan.maxScreens = 1;
                    plan.deviceTypes = "Mobile only";
                    plans.add(plan);
                }
            } else if (text.toLowerCase().contains("super") && text.toLowerCase().contains("ad-supported")) {
                // Extract Super plan
                ScrapedPlan plan = new ScrapedPlan("Super");
                Double[] prices = extractPricesFromText(text);
                if (prices[0] != null) {
                    plan.priceMonthly = prices[0];
                    plan.priceYearly = prices[1];
                    plan.hasAds = true;
                    plan.maxScreens = 2;
                    plan.deviceTypes = "All Devices";
                    plans.add(plan);
                }
            } else if (text.toLowerCase().contains("premium") && text.toLowerCase().contains("ad-free")) {
                // Extract Premium plan
                ScrapedPlan plan = new ScrapedPlan("Premium");
                // Premium has monthly price
                Pattern monthlyPattern = Pattern.compile("Rs\\s*([\\d,]+)\\s*/\\s*month");
                Matcher monthlyMatcher = monthlyPattern.matcher(text);
                if (monthlyMatcher.find()) {
                    plan.priceMonthly = Double.parseDouble(monthlyMatcher.group(1).replace(",", ""));
                }
                plan.hasAds = false;
                plan.maxScreens = 4;
                plan.deviceTypes = "All Devices";
                plan.extraFeatures = "Ad-free except LIVE";
                if (plan.priceMonthly != null) {
                    plans.add(plan);
                }
            }
        }

        return plans;
    }

    // Extract prices from text containing "Rs X / 3 months and Rs Y / year"
    private Double[] extractPricesFromText(String text) {
        Double[] prices = new Double[2]; // [monthly, yearly]

        // Pattern for 3 months price
        Pattern threeMonthPattern = Pattern.compile("Rs\\s*([\\d,]+)\\s*/\\s*3\\s*months");
        Matcher threeMonthMatcher = threeMonthPattern.matcher(text);
        if (threeMonthMatcher.find()) {
            Double threeMonthPrice = Double.parseDouble(threeMonthMatcher.group(1).replace(",", ""));
            prices[0] = Math.round(threeMonthPrice / 3.0 * 100.0) / 100.0;
        }

        // Pattern for yearly price
        Pattern yearlyPattern = Pattern.compile("Rs\\s*([\\d,]+)\\s*/\\s*year");
        Matcher yearlyMatcher = yearlyPattern.matcher(text);
        if (yearlyMatcher.find()) {
            prices[1] = Double.parseDouble(yearlyMatcher.group(1).replace(",", ""));
        }

        return prices;
    }

    private List<ScrapedPlan> extractDeepSeekPlans(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();

        // USD to INR conversion rate (approximate)
        final double USD_TO_INR = 83.0;

        // DeepSeek official pricing (as of late 2024):
        // V3.2 Chat: Input $0.27/1M (cache hit $0.07), Output $1.10/1M
        // DeepSeek Reasoner: Input $0.55/1M (cache hit $0.14), Output $2.19/1M
        final double DEFAULT_CHAT_INPUT = 0.27;
        final double DEFAULT_CHAT_OUTPUT = 1.10;
        final double DEFAULT_REASONER_INPUT = 0.55;
        final double DEFAULT_REASONER_OUTPUT = 2.19;

        try {
            // DeepSeek is pay-per-use API pricing, not monthly subscription
            // We'll create "plans" for each model with token pricing info

            String pageText = doc.text();

            // Extract token prices from the table
            Double inputCacheHitPrice = null;
            Double inputCacheMissPrice = null;
            Double outputPrice = null;

            // Pattern for prices: $0.028, $0.28, $0.42
            Pattern cacheHitPattern = Pattern.compile("1M\\s*INPUT\\s*TOKENS?\\s*\\(?CACHE\\s*HIT\\)?[^$]*\\$([\\d.]+)",
                    Pattern.CASE_INSENSITIVE);
            Matcher cacheHitMatcher = cacheHitPattern.matcher(pageText);
            if (cacheHitMatcher.find()) {
                inputCacheHitPrice = Double.parseDouble(cacheHitMatcher.group(1));
            }

            Pattern cacheMissPattern = Pattern.compile(
                    "1M\\s*INPUT\\s*TOKENS?\\s*\\(?CACHE\\s*MISS\\)?[^$]*\\$([\\d.]+)", Pattern.CASE_INSENSITIVE);
            Matcher cacheMissMatcher = cacheMissPattern.matcher(pageText);
            if (cacheMissMatcher.find()) {
                inputCacheMissPrice = Double.parseDouble(cacheMissMatcher.group(1));
            }

            Pattern outputPattern = Pattern.compile("1M\\s*OUTPUT\\s*TOKENS?[^$]*\\$([\\d.]+)",
                    Pattern.CASE_INSENSITIVE);
            Matcher outputMatcher = outputPattern.matcher(pageText);
            if (outputMatcher.find()) {
                outputPrice = Double.parseDouble(outputMatcher.group(1));
            }

            // If we found prices, use them, otherwise use defaults
            double chatInput = inputCacheMissPrice != null ? inputCacheMissPrice : DEFAULT_CHAT_INPUT;
            double chatOutput = outputPrice != null ? outputPrice : DEFAULT_CHAT_OUTPUT;
            double reasonerInput = DEFAULT_REASONER_INPUT;
            double reasonerOutput = DEFAULT_REASONER_OUTPUT;

            // Plan 1: deepseek-chat (Non-thinking Mode)
            ScrapedPlan chatPlan = new ScrapedPlan("DeepSeek Chat (V3.2)");
            chatPlan.priceMonthly = calculateEstimatedMonthlyCost(chatInput, chatOutput, USD_TO_INR);
            chatPlan.hasAds = false;
            chatPlan.features.add("Context Length: 128K tokens");
            chatPlan.features.add("Max Output: 8K tokens");
            chatPlan.features.add("JSON Output support");
            chatPlan.features.add("Tool Calls support");
            chatPlan.features.add("FIM Completion (Beta)");
            chatPlan.features.add("Chat Prefix Completion (Beta)");
            chatPlan.videoQuality = "N/A"; // Not applicable for API
            chatPlan.extraFeatures = String.format(
                    "Token Pricing: Input $%.2f/1M, Output $%.2f/1M (Pay-per-use API)",
                    chatInput, chatOutput);
            chatPlan.deviceTypes = "API Access";
            plans.add(chatPlan);

            // Plan 2: deepseek-reasoner (Thinking Mode)
            ScrapedPlan reasonerPlan = new ScrapedPlan("DeepSeek Reasoner (R1)");
            reasonerPlan.priceMonthly = calculateEstimatedMonthlyCost(reasonerInput, reasonerOutput, USD_TO_INR);
            reasonerPlan.hasAds = false;
            reasonerPlan.features.add("Context Length: 128K tokens");
            reasonerPlan.features.add("Max Output: 64K tokens");
            reasonerPlan.features.add("Thinking Mode enabled");
            reasonerPlan.features.add("Chain-of-thought reasoning");
            reasonerPlan.features.add("JSON Output support");
            reasonerPlan.features.add("Tool Calls support");
            reasonerPlan.videoQuality = "N/A";
            reasonerPlan.extraFeatures = String.format(
                    "Token Pricing: Input $%.2f/1M, Output $%.2f/1M (Pay-per-use API) | Thinking Mode",
                    reasonerInput, reasonerOutput);
            reasonerPlan.deviceTypes = "API Access";
            plans.add(reasonerPlan);

            // Plan 3: DeepSeek Pro (Higher limits for serious usage)
            ScrapedPlan proPlan = new ScrapedPlan("DeepSeek Pro (Estimated)");
            // Estimate for heavier usage: 10M input + 5M output tokens/month
            double proInput = reasonerInput * 10.0;
            double proOutput = reasonerOutput * 5.0;
            proPlan.priceMonthly = Math.round((proInput + proOutput) * USD_TO_INR * 100.0) / 100.0;
            proPlan.hasAds = false;
            proPlan.features.add("All Reasoner features");
            proPlan.features.add("Estimated heavy usage tier");
            proPlan.features.add("~10M input + 5M output tokens/month");
            proPlan.features.add("Priority support (assumed)");
            proPlan.videoQuality = "N/A";
            proPlan.extraFeatures = "Heavy usage estimate: ~10M input + 5M output tokens/month";
            proPlan.deviceTypes = "API Access";
            plans.add(proPlan);

            // Log results
            for (ScrapedPlan plan : plans) {
                logger.info("Extracted DeepSeek plan: {} - Est. ₹{}/month (based on typical usage)",
                        plan.planName, plan.priceMonthly);
            }

        } catch (Exception e) {
            logger.error("Error extracting DeepSeek plans: {}", e.getMessage(), e);

            // Even on error, return default plans
            plans.add(createDefaultDeepSeekPlan("DeepSeek Chat", DEFAULT_CHAT_INPUT, DEFAULT_CHAT_OUTPUT, USD_TO_INR));
            plans.add(createDefaultDeepSeekPlan("DeepSeek Reasoner", DEFAULT_REASONER_INPUT, DEFAULT_REASONER_OUTPUT,
                    USD_TO_INR));
        }

        return plans;
    }

    // Helper method to create default DeepSeek plan
    private ScrapedPlan createDefaultDeepSeekPlan(String name, double inputPrice, double outputPrice, double usdToInr) {
        ScrapedPlan plan = new ScrapedPlan(name);
        plan.priceMonthly = calculateEstimatedMonthlyCost(inputPrice, outputPrice, usdToInr);
        plan.hasAds = false;
        plan.features.add("Pay-per-use API pricing");
        plan.features.add("Context Length: 128K tokens");
        plan.extraFeatures = String.format("Input $%.2f/1M, Output $%.2f/1M", inputPrice, outputPrice);
        plan.deviceTypes = "API Access";
        return plan;
    }

    // Calculate estimated monthly cost for DeepSeek based on typical API usage
    // Assumption: ~1M input tokens + ~500K output tokens per month (light usage)
    private Double calculateEstimatedMonthlyCost(Double inputPricePerMillion, Double outputPricePerMillion,
            double usdToInr) {
        // Light usage estimate: 1M input tokens, 500K output tokens
        double inputCost = inputPricePerMillion * 1.0; // 1M tokens
        double outputCost = outputPricePerMillion * 0.5; // 500K tokens
        double totalUsd = inputCost + outputCost;

        // Convert to INR and round to 2 decimal places
        return Math.round(totalUsd * usdToInr * 100.0) / 100.0;
    }

    // Extract DeepSeek plans from table structure
    private List<ScrapedPlan> extractDeepSeekPlansFromTable(Document doc, double usdToInr) {
        List<ScrapedPlan> plans = new ArrayList<>();

        try {
            // Find table rows
            Elements rows = doc.select("table tr");

            Double inputCacheHit = null;
            Double inputCacheMiss = null;
            Double outputPrice = null;

            for (Element row : rows) {
                String rowText = row.text().toLowerCase();

                if (rowText.contains("cache hit")) {
                    Pattern pricePattern = Pattern.compile("\\$([\\d.]+)");
                    Matcher matcher = pricePattern.matcher(row.text());
                    if (matcher.find()) {
                        inputCacheHit = Double.parseDouble(matcher.group(1));
                    }
                } else if (rowText.contains("cache miss")) {
                    Pattern pricePattern = Pattern.compile("\\$([\\d.]+)");
                    Matcher matcher = pricePattern.matcher(row.text());
                    if (matcher.find()) {
                        inputCacheMiss = Double.parseDouble(matcher.group(1));
                    }
                } else if (rowText.contains("output token")) {
                    Pattern pricePattern = Pattern.compile("\\$([\\d.]+)");
                    Matcher matcher = pricePattern.matcher(row.text());
                    if (matcher.find()) {
                        outputPrice = Double.parseDouble(matcher.group(1));
                    }
                }
            }

            if (inputCacheMiss != null && outputPrice != null) {
                // Create a single plan for DeepSeek API
                ScrapedPlan plan = new ScrapedPlan("DeepSeek API (Pay-per-use)");
                plan.priceMonthly = calculateEstimatedMonthlyCost(inputCacheMiss, outputPrice, usdToInr);
                plan.hasAds = false;
                plan.features.add("Pay-per-use token pricing");
                plan.features.add("128K context length");
                plan.features.add("Multiple model versions available");
                plan.extraFeatures = String.format("Input: $%.3f/1M tokens, Output: $%.3f/1M tokens",
                        inputCacheMiss, outputPrice);
                plan.deviceTypes = "API Access";
                plans.add(plan);
            }

        } catch (Exception e) {
            logger.warn("Error extracting DeepSeek from table: {}", e.getMessage());
        }

        return plans;
    }

    private List<ScrapedPlan> extractGeminiPlans(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();

        try {
            String pageText = doc.text();

            // Plan 1: Free - ₹0/month
            ScrapedPlan freePlan = new ScrapedPlan("Gemini Free");
            freePlan.priceMonthly = 0.0;
            freePlan.hasAds = false;
            freePlan.deviceTypes = "All Devices";
            freePlan.features.add("Access to Gemini 2.5 Flash");
            freePlan.features.add("Limited access to Gemini 3 Pro");
            freePlan.features.add("Image generation and editing");
            freePlan.features.add("Deep Research");
            freePlan.features.add("Gemini Live");
            freePlan.features.add("Canvas and Gems");
            freePlan.features.add("100 monthly AI credits");
            freePlan.features.add("Flow - AI filmmaking tool");
            freePlan.features.add("Whisk - Image animation");
            freePlan.features.add("NotebookLM");
            freePlan.features.add("15 GB storage");
            freePlan.extraFeatures = "100 AI credits, 15 GB storage";
            plans.add(freePlan);
            logger.info("Added Gemini Free plan: ₹0/month");

            // Plan 2: Google AI Plus - ₹399/month (promo ₹199/month for 6 months)
            ScrapedPlan plusPlan = new ScrapedPlan("Google AI Plus");

            // Try to extract from text
            Pattern plusPattern = Pattern.compile("₹399\\s*INR/month", Pattern.CASE_INSENSITIVE);
            if (plusPattern.matcher(pageText).find()) {
                plusPlan.priceMonthly = 399.0;
            } else {
                plusPlan.priceMonthly = 399.0; // Default known price
            }

            plusPlan.hasAds = false;
            plusPlan.deviceTypes = "All Devices";
            plusPlan.features.add("Everything in free plus:");
            plusPlan.features.add("Enhanced access to Gemini 3 Pro");
            plusPlan.features.add("200 monthly AI credits");
            plusPlan.features.add("More Flow and Whisk access");
            plusPlan.features.add("NotebookLM with more Audio Overviews");
            plusPlan.features.add("Gemini in Gmail, Docs, Vids");
            plusPlan.features.add("200 GB storage");
            plusPlan.extraFeatures = "200 AI credits, 200 GB storage, Promo: ₹199/month for 6 months";
            plans.add(plusPlan);
            logger.info("Added Google AI Plus plan: ₹{}/month", plusPlan.priceMonthly);

            // Plan 3: Google AI Pro - ₹1,950/month
            ScrapedPlan proPlan = new ScrapedPlan("Google AI Pro");

            Pattern proPattern = Pattern.compile("₹1,?950\\s*INR/month", Pattern.CASE_INSENSITIVE);
            if (proPattern.matcher(pageText).find()) {
                proPlan.priceMonthly = 1950.0;
            } else {
                proPlan.priceMonthly = 1950.0; // Default known price
            }

            proPlan.hasAds = false;
            proPlan.deviceTypes = "All Devices";
            proPlan.features.add("Everything in free plus:");
            proPlan.features.add("Higher access to Gemini 3 Pro");
            proPlan.features.add("1,000 monthly AI credits");
            proPlan.features.add("Higher Flow and Whisk access");
            proPlan.features.add("Gemini Code Assist and CLI");
            proPlan.features.add("NotebookLM with 5x more features");
            proPlan.features.add("Gemini in Gmail, Docs, Vids");
            proPlan.features.add("2 TB storage");
            proPlan.extraFeatures = "1,000 AI credits, 2 TB storage, Promo: ₹0 for 1 month trial";
            plans.add(proPlan);
            logger.info("Added Google AI Pro plan: ₹{}/month", proPlan.priceMonthly);

            // Plan 4: Google AI Ultra - ₹24,500/month
            ScrapedPlan ultraPlan = new ScrapedPlan("Google AI Ultra");

            Pattern ultraPattern = Pattern.compile("₹24,?500\\s*INR/month", Pattern.CASE_INSENSITIVE);
            if (ultraPattern.matcher(pageText).find()) {
                ultraPlan.priceMonthly = 24500.0;
            } else {
                ultraPlan.priceMonthly = 24500.0; // Default known price
            }

            ultraPlan.hasAds = false;
            ultraPlan.deviceTypes = "All Devices";
            ultraPlan.features.add("Everything in Google AI Pro plus:");
            ultraPlan.features.add("Highest limits to all features");
            ultraPlan.features.add("Deep Think and Gemini Agent");
            ultraPlan.features.add("25,000 monthly AI credits");
            ultraPlan.features.add("Highest Flow and Whisk access");
            ultraPlan.features.add("Highest Gemini Code Assist and CLI limits");
            ultraPlan.features.add("NotebookLM - highest limits");
            ultraPlan.features.add("Highest Gemini in Google apps");
            ultraPlan.features.add("YouTube Premium individual plan");
            ultraPlan.features.add("30 TB storage");
            ultraPlan.extraFeatures = "25,000 AI credits, 30 TB storage, YouTube Premium included";
            plans.add(ultraPlan);
            logger.info("Added Google AI Ultra plan: ₹{}/month", ultraPlan.priceMonthly);

            // Try to extract prices from DOM if available
            extractGeminiPricesFromDOM(doc, plans);

        } catch (Exception e) {
            logger.error("Error extracting Gemini plans: {}", e.getMessage(), e);
        }

        return plans;
    }

    // Helper to extract/update Gemini prices from DOM
    private void extractGeminiPricesFromDOM(Document doc, List<ScrapedPlan> plans) {
        try {
            // Look for price-amount spans
            Elements priceElements = doc.select("span.price-amount");

            for (Element priceEl : priceElements) {
                String priceText = priceEl.text().trim().replace(",", "");

                try {
                    Double price = Double.parseDouble(priceText);

                    // Try to find which plan this price belongs to by looking at parent
                    Element card = priceEl.closest("div[class*='_card_']");
                    if (card != null) {
                        Element logoText = card.selectFirst("div[class*='_cardLogoText_']");
                        if (logoText != null) {
                            String planName = logoText.text().trim();

                            // Update corresponding plan price
                            for (ScrapedPlan plan : plans) {
                                if (planName.toLowerCase().contains("free") && plan.planName.contains("Free")) {
                                    // Skip - free is already 0
                                } else if (planName.toLowerCase().contains("plus") && plan.planName.contains("Plus")) {
                                    if (price > 100)
                                        plan.priceMonthly = price;
                                } else if (planName.toLowerCase().contains("pro")
                                        && !planName.toLowerCase().contains("plus")
                                        && plan.planName.contains("Pro") && !plan.planName.contains("Plus")) {
                                    if (price > 500)
                                        plan.priceMonthly = price;
                                } else if (planName.toLowerCase().contains("ultra")
                                        && plan.planName.contains("Ultra")) {
                                    if (price > 10000)
                                        plan.priceMonthly = price;
                                }
                            }
                        }
                    }
                } catch (NumberFormatException e) {
                    // Skip non-numeric prices
                }
            }
        } catch (Exception e) {
            logger.warn("Error extracting Gemini prices from DOM: {}", e.getMessage());
        }
    }

    private List<ScrapedPlan> extractPerplexityPlans(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();

        // USD to INR conversion rate (approximate)
        final double USD_TO_INR = 83.0;

        try {
            String pageText = doc.text();

            // Plan 1: Perplexity Pro - $20/month or $200/year
            ScrapedPlan proPlan = new ScrapedPlan("Perplexity Pro");

            // Extract Pro price from text
            Pattern proMonthlyPattern = Pattern.compile("\\$20\\s*/\\s*month", Pattern.CASE_INSENSITIVE);
            if (proMonthlyPattern.matcher(pageText).find()) {
                proPlan.priceMonthly = 20.0 * USD_TO_INR; // Convert to INR
            }

            Pattern proYearlyPattern = Pattern.compile("\\$200/year", Pattern.CASE_INSENSITIVE);
            if (proYearlyPattern.matcher(pageText).find()) {
                proPlan.priceYearly = 200.0 * USD_TO_INR;
            }

            if (proPlan.priceMonthly != null) {
                proPlan.hasAds = false;
                proPlan.deviceTypes = "All Devices";
                proPlan.features.add("Unlimited Pro searches");
                proPlan.features.add("10x citations in answers");
                proPlan.features.add("Extended access to Research");
                proPlan.features.add("Extended access to Perplexity Labs");
                proPlan.features.add("Extended access to image generation");
                proPlan.features.add("One subscription to the latest AI models");
                proPlan.extraFeatures = "Personal use, AI-powered search";
                plans.add(proPlan);
                logger.info("Extracted Perplexity Pro: $20/month = ₹{}/month", proPlan.priceMonthly);
            }

            // Plan 2: Enterprise - $40/month per seat or $400/year
            ScrapedPlan enterprisePlan = new ScrapedPlan("Perplexity Enterprise");

            Pattern enterpriseMonthlyPattern = Pattern.compile("\\$40\\s*/\\s*month\\s*per\\s*seat",
                    Pattern.CASE_INSENSITIVE);
            if (enterpriseMonthlyPattern.matcher(pageText).find()) {
                enterprisePlan.priceMonthly = 40.0 * USD_TO_INR;
            }

            Pattern enterpriseYearlyPattern = Pattern.compile("\\$400/year", Pattern.CASE_INSENSITIVE);
            if (enterpriseYearlyPattern.matcher(pageText).find()) {
                enterprisePlan.priceYearly = 400.0 * USD_TO_INR;
            }

            if (enterprisePlan.priceMonthly != null) {
                enterprisePlan.hasAds = false;
                enterprisePlan.deviceTypes = "All Devices";
                enterprisePlan.features.add("All Perplexity Pro features");
                enterprisePlan.features.add("Collaborate in private Spaces");
                enterprisePlan.features.add("Get answers from file, productivity, and organizational apps");
                enterprisePlan.features.add("Up to 15,000 file uploads");
                enterprisePlan.features.add("Single Sign On or SCIM provisioning");
                enterprisePlan.features.add("User management and permissioning");
                enterprisePlan.features.add("Data retention configurability");
                enterprisePlan.features.add("Audit logs and team insights (50 seat min)");
                enterprisePlan.features.add("No training on your data");
                enterprisePlan.features.add("SOC 2 Type II compliant");
                enterprisePlan.extraFeatures = "Team/Business plan, per-seat pricing";
                plans.add(enterprisePlan);
                logger.info("Extracted Perplexity Enterprise: $40/seat/month = ₹{}/month", enterprisePlan.priceMonthly);
            }

            // Plan 3: Enterprise Max - $325/month per seat or $3,250/year
            ScrapedPlan maxPlan = new ScrapedPlan("Perplexity Enterprise Max");

            Pattern maxMonthlyPattern = Pattern.compile("\\$325\\s*/\\s*month\\s*per\\s*seat",
                    Pattern.CASE_INSENSITIVE);
            if (maxMonthlyPattern.matcher(pageText).find()) {
                maxPlan.priceMonthly = 325.0 * USD_TO_INR;
            }

            Pattern maxYearlyPattern = Pattern.compile("\\$3,?250/year", Pattern.CASE_INSENSITIVE);
            if (maxYearlyPattern.matcher(pageText).find()) {
                maxPlan.priceYearly = 3250.0 * USD_TO_INR;
            }

            if (maxPlan.priceMonthly != null) {
                maxPlan.hasAds = false;
                maxPlan.deviceTypes = "All Devices";
                maxPlan.features.add("All Enterprise Pro features");
                maxPlan.features.add("Unlimited Labs queries");
                maxPlan.features.add("Access to Advanced AI models (o3-pro, Opus 4.5 Thinking)");
                maxPlan.features.add("Greater file upload limits");
                maxPlan.features.add("Enhanced video generation");
                maxPlan.features.add("Comet Max assistant");
                maxPlan.features.add("Data retention configurability (no seat min)");
                maxPlan.features.add("Audit logs and team insights");
                maxPlan.features.add("No training on your data");
                maxPlan.features.add("SOC 2 Type II compliant");
                maxPlan.extraFeatures = "Premium Enterprise, advanced AI models";
                plans.add(maxPlan);
                logger.info("Extracted Perplexity Enterprise Max: $325/seat/month = ₹{}/month", maxPlan.priceMonthly);
            }

            // If pattern matching failed, try DOM-based extraction
            if (plans.isEmpty()) {
                plans = extractPerplexityPlansFromDOM(doc, USD_TO_INR);
            }

            // If still empty, use hardcoded fallback plans
            if (plans.isEmpty()) {
                logger.info("Using hardcoded Perplexity plans as fallback");
                plans = getHardcodedPerplexityPlans(USD_TO_INR);
            }

        } catch (Exception e) {
            logger.error("Error extracting Perplexity plans: {}", e.getMessage(), e);
            // Return hardcoded plans as final fallback
            return getHardcodedPerplexityPlans(83.0);
        }

        return plans;
    }

    // Hardcoded Perplexity plans as fallback
    private List<ScrapedPlan> getHardcodedPerplexityPlans(double usdToInr) {
        List<ScrapedPlan> plans = new ArrayList<>();

        // Perplexity Pro - $20/month
        ScrapedPlan proPlan = new ScrapedPlan("Perplexity Pro");
        proPlan.priceMonthly = 20.0 * usdToInr;
        proPlan.priceYearly = 200.0 * usdToInr;
        proPlan.hasAds = false;
        proPlan.deviceTypes = "All Devices";
        proPlan.features.add("Unlimited Pro searches");
        proPlan.features.add("Access to GPT-4, Claude 3, and more");
        proPlan.features.add("Extended access to Research");
        proPlan.features.add("File uploads and analysis");
        proPlan.features.add("API access included");
        proPlan.extraFeatures = "Personal Pro plan - Best for individuals";
        plans.add(proPlan);

        // Perplexity Enterprise - $40/month per seat
        ScrapedPlan enterprisePlan = new ScrapedPlan("Perplexity Enterprise");
        enterprisePlan.priceMonthly = 40.0 * usdToInr;
        enterprisePlan.priceYearly = 400.0 * usdToInr;
        enterprisePlan.hasAds = false;
        enterprisePlan.deviceTypes = "All Devices";
        enterprisePlan.features.add("All Pro features");
        enterprisePlan.features.add("Team collaboration in Spaces");
        enterprisePlan.features.add("SSO & SCIM provisioning");
        enterprisePlan.features.add("User management");
        enterprisePlan.features.add("SOC 2 Type II compliant");
        enterprisePlan.extraFeatures = "Team plan - $40/seat/month";
        plans.add(enterprisePlan);

        // Perplexity Enterprise Max - $325/month per seat
        ScrapedPlan maxPlan = new ScrapedPlan("Perplexity Enterprise Max");
        maxPlan.priceMonthly = 325.0 * usdToInr;
        maxPlan.priceYearly = 3250.0 * usdToInr;
        maxPlan.hasAds = false;
        maxPlan.deviceTypes = "All Devices";
        maxPlan.features.add("All Enterprise features");
        maxPlan.features.add("Unlimited Labs queries");
        maxPlan.features.add("Advanced AI models (o3-pro, Opus 4.5)");
        maxPlan.features.add("Enhanced file & video generation");
        maxPlan.features.add("Priority support");
        maxPlan.extraFeatures = "Premium Enterprise - $325/seat/month";
        plans.add(maxPlan);

        return plans;
    }

    // Fallback DOM-based extraction for Perplexity
    private List<ScrapedPlan> extractPerplexityPlansFromDOM(Document doc, double usdToInr) {
        List<ScrapedPlan> plans = new ArrayList<>();

        try {
            // Look for price elements containing $ amounts
            Elements priceElements = doc.select("h2.framer-text, span.framer-text");

            for (Element el : priceElements) {
                String text = el.text().trim();

                // Look for price patterns
                Pattern pricePattern = Pattern.compile("\\$(\\d+(?:,\\d+)?)\\s*/\\s*month");
                Matcher matcher = pricePattern.matcher(text);

                if (matcher.find()) {
                    String priceStr = matcher.group(1).replace(",", "");
                    Double priceUsd = Double.parseDouble(priceStr);
                    Double priceInr = priceUsd * usdToInr;

                    // Determine plan type based on price
                    String planName;
                    if (priceUsd <= 25) {
                        planName = "Perplexity Pro";
                    } else if (priceUsd <= 50) {
                        planName = "Perplexity Enterprise";
                    } else {
                        planName = "Perplexity Enterprise Max";
                    }

                    // Check if plan already exists
                    boolean exists = plans.stream().anyMatch(p -> p.planName.equals(planName));
                    if (!exists) {
                        ScrapedPlan plan = new ScrapedPlan(planName);
                        plan.priceMonthly = priceInr;
                        plan.hasAds = false;
                        plan.deviceTypes = "All Devices";
                        plan.features.add("AI-powered search");
                        plans.add(plan);
                    }
                }
            }

        } catch (Exception e) {
            logger.warn("Error in DOM extraction for Perplexity: {}", e.getMessage());
        }

        return plans;
    }

    private List<ScrapedPlan> extractGoogleWorkspacePlans(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();

        try {
            String pageText = doc.text();

            // Plan 1: Starter - ₹160.65/user/month (discounted from ₹270)
            ScrapedPlan starterPlan = new ScrapedPlan("Google Workspace Starter");

            // Try to extract price
            Pattern starterPattern = Pattern.compile("Starter.*?₹([\\d,.]+)",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher starterMatcher = starterPattern.matcher(pageText);
            if (starterMatcher.find()) {
                String priceStr = starterMatcher.group(1).replace(",", "");
                starterPlan.priceMonthly = Double.parseDouble(priceStr);
            } else {
                starterPlan.priceMonthly = 160.65; // Default known price
            }

            starterPlan.hasAds = false;
            starterPlan.deviceTypes = "All Devices";
            starterPlan.features.add("30 GB pooled storage per person");
            starterPlan.features.add("Custom business email (you@your-company.com)");
            starterPlan.features.add("Gemini AI assistant in Gmail");
            starterPlan.features.add("Chat with AI in the Gemini app");
            starterPlan.features.add("Video meetings, 100 participants");
            starterPlan.features.add("Google Vids AI-powered video creator");
            starterPlan.features.add("Security and management controls");
            starterPlan.extraFeatures = "30 GB storage, 100 participants, Per-user pricing";
            starterPlan.maxScreens = 100; // Meet participants
            plans.add(starterPlan);
            logger.info("Added Google Workspace Starter: ₹{}/user/month", starterPlan.priceMonthly);

            // Plan 2: Standard - ₹864/user/month (discounted from ₹1,080)
            ScrapedPlan standardPlan = new ScrapedPlan("Google Workspace Standard");

            Pattern standardPattern = Pattern.compile("Standard.*?₹([\\d,.]+)",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher standardMatcher = standardPattern.matcher(pageText);
            if (standardMatcher.find()) {
                String priceStr = standardMatcher.group(1).replace(",", "");
                Double price = Double.parseDouble(priceStr);
                if (price > 500) { // Sanity check
                    standardPlan.priceMonthly = price;
                } else {
                    standardPlan.priceMonthly = 864.0;
                }
            } else {
                standardPlan.priceMonthly = 864.0; // Default known price
            }

            standardPlan.hasAds = false;
            standardPlan.deviceTypes = "All Devices";
            standardPlan.features.add("All of Starter and:");
            standardPlan.features.add("2 TB storage (65x more than Starter)");
            standardPlan.features.add("Gemini AI assistant in Gmail, Docs, Meet and more");
            standardPlan.features.add("NotebookLM with expanded access");
            standardPlan.features.add("Video meetings with recording, noise cancellation, 150 participants");
            standardPlan.features.add("Appointment booking pages");
            standardPlan.features.add("eSignature with Docs and PDFs");
            standardPlan.features.add("Google Workspace Migrate tool");
            standardPlan.extraFeatures = "2 TB storage, 150 participants, NotebookLM, eSignature";
            standardPlan.maxScreens = 150;
            plans.add(standardPlan);
            logger.info("Added Google Workspace Standard: ₹{}/user/month", standardPlan.priceMonthly);

            // Plan 3: Plus - ₹1,700/user/month
            ScrapedPlan plusPlan = new ScrapedPlan("Google Workspace Plus");

            Pattern plusPattern = Pattern.compile("Plus.*?₹([\\d,.]+)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher plusMatcher = plusPattern.matcher(pageText);
            if (plusMatcher.find()) {
                String priceStr = plusMatcher.group(1).replace(",", "");
                Double price = Double.parseDouble(priceStr);
                if (price > 1000) {
                    plusPlan.priceMonthly = price;
                } else {
                    plusPlan.priceMonthly = 1700.0;
                }
            } else {
                plusPlan.priceMonthly = 1700.0; // Default known price
            }

            plusPlan.hasAds = false;
            plusPlan.deviceTypes = "All Devices";
            plusPlan.features.add("All of Standard and:");
            plusPlan.features.add("5 TB storage (2.5x more than Standard)");
            plusPlan.features.add("eDiscovery for email");
            plusPlan.features.add("Video meetings with attendance tracking, 500 participants");
            plusPlan.features.add("Vault to retain, archive and search data");
            plusPlan.features.add("Secure LDAP");
            plusPlan.features.add("Advanced endpoint management");
            plusPlan.features.add("Enhanced security and management controls");
            plusPlan.extraFeatures = "5 TB storage, 500 participants, Vault, eDiscovery";
            plusPlan.maxScreens = 500;
            plans.add(plusPlan);
            logger.info("Added Google Workspace Plus: ₹{}/user/month", plusPlan.priceMonthly);

            // Plan 4: Enterprise - Custom pricing
            ScrapedPlan enterprisePlan = new ScrapedPlan("Google Workspace Enterprise");
            enterprisePlan.priceMonthly = null; // Contact sales - custom pricing
            enterprisePlan.hasAds = false;
            enterprisePlan.deviceTypes = "All Devices";
            enterprisePlan.features.add("All of Plus and:");
            enterprisePlan.features.add("5 TB storage (upgradable)");
            enterprisePlan.features.add("S/MIME encryption for email");
            enterprisePlan.features.add("Video meetings with in-domain live streaming, 1,000 participants");
            enterprisePlan.features.add("Data Loss Prevention (DLP)");
            enterprisePlan.features.add("Context-aware access");
            enterprisePlan.features.add("Enterprise data regions");
            enterprisePlan.features.add("Cloud Identity Premium");
            enterprisePlan.features.add("Enterprise endpoint management");
            enterprisePlan.features.add("AI classification for Google Drive");
            enterprisePlan.features.add("Assured Controls available as add-on");
            enterprisePlan.features.add("Enhanced Support for faster response times");
            enterprisePlan.extraFeatures = "5 TB+, 1000 participants, DLP, S/MIME, Contact Sales";
            enterprisePlan.maxScreens = 1000;
            // Don't add Enterprise without price - or add with null price indicator
            // plans.add(enterprisePlan); // Uncomment if you want to include custom pricing
            // plans
            logger.info("Google Workspace Enterprise: Contact Sales for pricing");

            // Try to extract prices from DOM
            extractGoogleWorkspacePricesFromDOM(doc, plans);

        } catch (Exception e) {
            logger.error("Error extracting Google Workspace plans: {}", e.getMessage(), e);
        }

        return plans;
    }

    // Helper to extract Google Workspace prices from DOM
    private void extractGoogleWorkspacePricesFromDOM(Document doc, List<ScrapedPlan> plans) {
        try {
            // Look for price elements in .NAufUb divs
            Elements priceElements = doc.select("div.NAufUb");
            Elements planNames = doc.select("div.bznaLe");

            for (int i = 0; i < Math.min(priceElements.size(), planNames.size()); i++) {
                String planName = planNames.get(i).text().trim();
                String priceText = priceElements.get(i).text().trim();

                // Extract price from text like "₹160.65"
                Pattern pricePattern = Pattern.compile("₹([\\d,.]+)");
                Matcher matcher = pricePattern.matcher(priceText);

                if (matcher.find()) {
                    String priceStr = matcher.group(1).replace(",", "");
                    Double price = Double.parseDouble(priceStr);

                    // Update corresponding plan
                    for (ScrapedPlan plan : plans) {
                        if (planName.toLowerCase().contains("starter") && plan.planName.contains("Starter")) {
                            plan.priceMonthly = price;
                        } else if (planName.toLowerCase().contains("standard") && plan.planName.contains("Standard")) {
                            plan.priceMonthly = price;
                        } else if (planName.toLowerCase().contains("plus") && plan.planName.contains("Plus")) {
                            plan.priceMonthly = price;
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Error extracting Google Workspace prices from DOM: {}", e.getMessage());
        }
    }

    private List<ScrapedPlan> extractMicrosoft365Plans(Document doc) {
        List<ScrapedPlan> plans = new ArrayList<>();

        try {
            String pageText = doc.text();

            // Plan 1: Microsoft 365 Personal - ₹689/month, ₹6,899/year
            ScrapedPlan personalPlan = new ScrapedPlan("Microsoft 365 Personal");

            // Try to extract price
            Pattern personalPattern = Pattern.compile("Personal.*?₹\\s*([\\d,.]+)/month",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher personalMatcher = personalPattern.matcher(pageText);
            if (personalMatcher.find()) {
                String priceStr = personalMatcher.group(1).replace(",", "").replace(" ", "");
                personalPlan.priceMonthly = Double.parseDouble(priceStr);
            } else {
                personalPlan.priceMonthly = 689.0; // Default known price
            }

            // Try to extract yearly price
            Pattern personalYearlyPattern = Pattern.compile("Personal.*?₹\\s*([\\d,.]+)/year",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher personalYearlyMatcher = personalYearlyPattern.matcher(pageText);
            if (personalYearlyMatcher.find()) {
                String priceStr = personalYearlyMatcher.group(1).replace(",", "").replace(" ", "");
                personalPlan.priceYearly = Double.parseDouble(priceStr);
            } else {
                personalPlan.priceYearly = 6899.0;
            }

            personalPlan.hasAds = false;
            personalPlan.deviceTypes = "PC, Mac, Phone, Tablet";
            personalPlan.maxScreens = 5; // 5 devices simultaneously
            personalPlan.features.add("For one person");
            personalPlan.features.add("Use on up to 5 devices simultaneously");
            personalPlan.features.add("1 TB secure cloud storage");
            personalPlan.features.add("Microsoft Copilot AI assistant");
            personalPlan.features.add("Word, Excel, PowerPoint, Outlook, OneNote");
            personalPlan.features.add("OneDrive cloud storage");
            personalPlan.features.add("Microsoft Defender security");
            personalPlan.features.add("Microsoft Designer");
            personalPlan.features.add("Clipchamp video editor");
            personalPlan.extraFeatures = "1 TB storage, 5 devices, Copilot included";
            plans.add(personalPlan);
            logger.info("Added Microsoft 365 Personal: ₹{}/month, ₹{}/year", personalPlan.priceMonthly,
                    personalPlan.priceYearly);

            // Plan 2: Microsoft 365 Family - ₹819/month, ₹8,199/year
            ScrapedPlan familyPlan = new ScrapedPlan("Microsoft 365 Family");

            Pattern familyPattern = Pattern.compile("Family.*?₹\\s*([\\d,.]+)/month",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher familyMatcher = familyPattern.matcher(pageText);
            if (familyMatcher.find()) {
                String priceStr = familyMatcher.group(1).replace(",", "").replace(" ", "");
                familyPlan.priceMonthly = Double.parseDouble(priceStr);
            } else {
                familyPlan.priceMonthly = 819.0;
            }

            Pattern familyYearlyPattern = Pattern.compile("Family.*?₹\\s*([\\d,.]+)/year",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher familyYearlyMatcher = familyYearlyPattern.matcher(pageText);
            if (familyYearlyMatcher.find()) {
                String priceStr = familyYearlyMatcher.group(1).replace(",", "").replace(" ", "");
                familyPlan.priceYearly = Double.parseDouble(priceStr);
            } else {
                familyPlan.priceYearly = 8199.0;
            }

            familyPlan.hasAds = false;
            familyPlan.deviceTypes = "PC, Mac, Phone, Tablet";
            familyPlan.maxScreens = 5; // 5 devices per person
            familyPlan.features.add("For 1 to 6 people");
            familyPlan.features.add("Each person can use on up to 5 devices");
            familyPlan.features.add("Up to 6 TB cloud storage (1 TB per person)");
            familyPlan.features.add("Microsoft Copilot AI assistant");
            familyPlan.features.add("Word, Excel, PowerPoint, Outlook, OneNote");
            familyPlan.features.add("OneDrive cloud storage");
            familyPlan.features.add("Microsoft Defender security");
            familyPlan.features.add("Microsoft Designer");
            familyPlan.features.add("Clipchamp video editor");
            familyPlan.extraFeatures = "6 TB storage, 6 users, 5 devices each, Copilot";
            plans.add(familyPlan);
            logger.info("Added Microsoft 365 Family: ₹{}/month, ₹{}/year", familyPlan.priceMonthly,
                    familyPlan.priceYearly);

            // Plan 3: Microsoft 365 Premium - ₹1,999/month, ₹19,999/year
            ScrapedPlan premiumPlan = new ScrapedPlan("Microsoft 365 Premium");

            Pattern premiumPattern = Pattern.compile("Premium.*?₹\\s*([\\d,.]+)/month",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher premiumMatcher = premiumPattern.matcher(pageText);
            if (premiumMatcher.find()) {
                String priceStr = premiumMatcher.group(1).replace(",", "").replace(" ", "");
                premiumPlan.priceMonthly = Double.parseDouble(priceStr);
            } else {
                premiumPlan.priceMonthly = 1999.0;
            }

            Pattern premiumYearlyPattern = Pattern.compile("Premium.*?₹\\s*([\\d,.]+)/year",
                    Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
            Matcher premiumYearlyMatcher = premiumYearlyPattern.matcher(pageText);
            if (premiumYearlyMatcher.find()) {
                String priceStr = premiumYearlyMatcher.group(1).replace(",", "").replace(" ", "");
                premiumPlan.priceYearly = Double.parseDouble(priceStr);
            } else {
                premiumPlan.priceYearly = 19999.0;
            }

            premiumPlan.hasAds = false;
            premiumPlan.deviceTypes = "PC, Mac, Phone, Tablet";
            premiumPlan.maxScreens = 5;
            premiumPlan.features.add("For 1 to 6 people");
            premiumPlan.features.add("Each person can use on up to 5 devices");
            premiumPlan.features.add("Up to 6 TB cloud storage (1 TB per person)");
            premiumPlan.features.add("Highest usage limits for Copilot features");
            premiumPlan.features.add("Exclusive Premium Copilot features");
            premiumPlan.features.add("Word, Excel, PowerPoint, Outlook, OneNote");
            premiumPlan.features.add("OneDrive cloud storage");
            premiumPlan.features.add("Microsoft Defender security");
            premiumPlan.features.add("Microsoft Designer");
            premiumPlan.features.add("Clipchamp video editor");
            premiumPlan.extraFeatures = "6 TB, 6 users, Highest Copilot limits, Premium-exclusive features";
            plans.add(premiumPlan);
            logger.info("Added Microsoft 365 Premium: ₹{}/month, ₹{}/year", premiumPlan.priceMonthly,
                    premiumPlan.priceYearly);

            // Try to extract prices from DOM
            extractMicrosoft365PricesFromDOM(doc, plans);

        } catch (Exception e) {
            logger.error("Error extracting Microsoft 365 plans: {}", e.getMessage(), e);
        }

        return plans;
    }

    // Helper to extract Microsoft 365 prices from DOM
    private void extractMicrosoft365PricesFromDOM(Document doc, List<ScrapedPlan> plans) {
        try {
            // Look for card elements with plan names and prices
            Elements cards = doc.select("div.card");

            for (Element card : cards) {
                Element titleEl = card.selectFirst("h2.h4");
                Element priceEl = card.selectFirst("div.sku1price.price-heading");

                if (titleEl != null && priceEl != null) {
                    String planName = titleEl.text().trim();
                    String priceText = priceEl.text().trim();

                    // Extract price
                    Pattern pricePattern = Pattern.compile("₹\\s*([\\d,.]+)");
                    Matcher matcher = pricePattern.matcher(priceText);

                    if (matcher.find()) {
                        String priceStr = matcher.group(1).replace(",", "").replace(" ", "");
                        Double price = Double.parseDouble(priceStr);

                        // Update corresponding plan
                        for (ScrapedPlan plan : plans) {
                            if (planName.toLowerCase().contains("personal") && plan.planName.contains("Personal")) {
                                plan.priceMonthly = price;
                            } else if (planName.toLowerCase().contains("family") && plan.planName.contains("Family")) {
                                plan.priceMonthly = price;
                            } else if (planName.toLowerCase().contains("premium")
                                    && plan.planName.contains("Premium")) {
                                plan.priceMonthly = price;
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.warn("Error extracting Microsoft 365 prices from DOM: {}", e.getMessage());
        }
    }

    // ==================== UTILITY METHODS ====================

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
        List<Watchlist> watchlistItems = watchlistRepository.findAll()
                .stream()
                .filter(w -> w.getSubscription().getId().equals(subscription.getId()))
                .filter(Watchlist::getNotifyOnPriceDrop)
                .toList();

        for (Watchlist item : watchlistItems) {
            if (item.getTargetPrice() == null || newPrice <= item.getTargetPrice()) {
                User user = item.getUser();
                alertService.createPriceDropAlert(user, subscription, oldPrice, newPrice);
                logger.info("Created price drop alert for user {} for {}", user.getEmail(), subscription.getName());
            }
        }
    }

    // Get all plans for a subscription
    public List<SubscriptionPlan> getPlansForSubscription(Long subscriptionId) {
        return subscriptionPlanRepository.findBySubscriptionIdOrderByPriceMonthlyAsc(subscriptionId);
    }

    // Get all plans for a subscription by name
    public List<SubscriptionPlan> getPlansForSubscription(String subscriptionName) {
        return subscriptionPlanRepository.findBySubscriptionName(subscriptionName);
    }
}
