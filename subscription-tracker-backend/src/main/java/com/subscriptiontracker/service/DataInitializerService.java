package com.subscriptiontracker.service;

import com.subscriptiontracker.entity.Subscription;
import com.subscriptiontracker.repository.SubscriptionPlanRepository;
import com.subscriptiontracker.repository.SubscriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializerService implements CommandLineRunner {

        private static final Logger logger = LoggerFactory.getLogger(DataInitializerService.class);

        @Autowired
        private SubscriptionRepository subscriptionRepository;

        @Autowired
        private SubscriptionPlanRepository subscriptionPlanRepository;

        @Autowired
        private PriceScraperService priceScraperService;

        @Autowired
        private AdminService adminService;

        @Override
        public void run(String... args) throws Exception {
                initializeSubscriptions();
                checkAndTriggerScraping();
                initializeAdmin(); // Initialize default admin
        }

        private void initializeAdmin() {
                try {
                        adminService.createDefaultAdmin();
                        logger.info("Default admin account initialized.");
                } catch (Exception e) {
                        logger.warn("Failed to initialize admin account: {}", e.getMessage());
                }
        }

        private void checkAndTriggerScraping() {
                // Check if we have any subscription plans scraped
                long planCount = subscriptionPlanRepository.count();
                long subscriptionCount = subscriptionRepository.count();

                if (subscriptionCount > 0 && planCount == 0) {
                        logger.info("Subscriptions exist but no plans scraped yet. Triggering initial scraping...");
                        try {
                                priceScraperService.scrapeAllPrices();
                                logger.info("Initial price scraping completed. Plans scraped: {}",
                                                subscriptionPlanRepository.count());
                        } catch (Exception e) {
                                logger.warn("Initial price scraping failed: {}. Prices will be updated on next scheduled run.",
                                                e.getMessage());
                        }
                } else if (planCount > 0) {
                        logger.info("Found {} existing subscription plans. Skipping initial scrape.", planCount);
                }
        }

        private void initializeSubscriptions() {
                // Check if subscriptions already exist
                if (subscriptionRepository.count() > 0) {
                        logger.info("Subscriptions already initialized. Found {} subscriptions.",
                                        subscriptionRepository.count());
                        return;
                }

                logger.info("Initializing subscription data...");

                List<Subscription> subscriptions = Arrays.asList(
                                // Streaming Services
                                Subscription.builder()
                                                .name("Netflix")
                                                .description("Watch TV shows, movies, and documentaries. Multiple plans available.")
                                                .logoUrl("https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico")
                                                .websiteUrl("https://www.netflix.com/in/")
                                                .category("Streaming")
                                                .priceMonthly(199.0)
                                                .priceYearly(2388.0)
                                                .currency("INR")
                                                .features("Mobile plan, Basic plan, Standard plan, Premium plan available")
                                                .maxDevices(4)
                                                .streamingQuality("4K UHD")
                                                .build(),

                                Subscription.builder()
                                                .name("Amazon Prime")
                                                .description("Prime Video, Prime Music, Free Delivery, and more.")
                                                .logoUrl("https://www.amazon.in/favicon.ico")
                                                .websiteUrl("https://www.primevideo.com/")
                                                .category("Streaming")
                                                .priceMonthly(299.0)
                                                .priceYearly(1499.0)
                                                .currency("INR")
                                                .features("Prime Video, Prime Music, Free Delivery, Prime Reading")
                                                .maxDevices(3)
                                                .streamingQuality("4K UHD")
                                                .build(),

                                Subscription.builder()
                                                .name("JioHotstar")
                                                .description("JioHotstar - Stream movies, TV shows, live sports & Disney+ content.")
                                                .logoUrl("https://www.jiohotstar.com/favicon.ico")
                                                .websiteUrl("https://www.jiohotstar.com/subscribe")
                                                .category("Streaming")
                                                .priceMonthly(149.0)
                                                .priceYearly(1499.0)
                                                .currency("INR")
                                                .features("Disney+ content, Live Sports, HBO Originals, Peacock content, 4K streaming")
                                                .maxDevices(4)
                                                .streamingQuality("4K UHD")
                                                .build(),

                                // Music Services
                                Subscription.builder()
                                                .name("Spotify")
                                                .description("Music streaming service with millions of songs and podcasts.")
                                                .logoUrl("https://www.spotify.com/favicon.ico")
                                                .websiteUrl("https://www.spotify.com/in/premium/")
                                                .category("Music")
                                                .priceMonthly(119.0)
                                                .priceYearly(1189.0)
                                                .currency("INR")
                                                .features("Ad-free music, Offline listening, High quality audio")
                                                .maxDevices(1)
                                                .streamingQuality("320 kbps")
                                                .build(),

                                // AI Services
                                Subscription.builder()
                                                .name("Perplexity")
                                                .description("AI-powered answer engine for research and discovery.")
                                                .logoUrl("https://www.perplexity.ai/favicon.ico")
                                                .websiteUrl("https://www.perplexity.ai/pro")
                                                .category("AI")
                                                .priceMonthly(1650.0)
                                                .priceYearly(16500.0)
                                                .currency("INR")
                                                .features("Unlimited Pro searches, GPT-4 access, File uploads, API access")
                                                .maxDevices(5)
                                                .streamingQuality("N/A")
                                                .build(),

                                Subscription.builder()
                                                .name("DeepSeek")
                                                .description("Advanced AI assistant with powerful reasoning capabilities.")
                                                .logoUrl("https://www.deepseek.com/favicon.ico")
                                                .websiteUrl("https://www.deepseek.com/")
                                                .category("AI")
                                                .priceMonthly(0.0) // Currently free with API usage
                                                .priceYearly(0.0)
                                                .currency("INR")
                                                .features("Free tier available, API access, Advanced reasoning")
                                                .maxDevices(10)
                                                .streamingQuality("N/A")
                                                .build(),

                                Subscription.builder()
                                                .name("Gemini")
                                                .description("Google's most capable AI model.")
                                                .logoUrl("https://gemini.google.com/favicon.ico")
                                                .websiteUrl("https://gemini.google.com/")
                                                .category("AI")
                                                .priceMonthly(1950.0)
                                                .priceYearly(19500.0)
                                                .currency("INR")
                                                .features("Gemini Advanced, 1TB storage, Google One benefits")
                                                .maxDevices(10)
                                                .streamingQuality("N/A")
                                                .build(),

                                // Productivity
                                Subscription.builder()
                                                .name("Google Workspace")
                                                .description("Professional email, cloud storage, and productivity apps.")
                                                .logoUrl("https://workspace.google.com/favicon.ico")
                                                .websiteUrl("https://workspace.google.com/pricing.html")
                                                .category("Productivity")
                                                .priceMonthly(136.0)
                                                .priceYearly(1360.0)
                                                .currency("INR")
                                                .features("Custom email, 30GB storage, Google Meet, Docs, Sheets, Slides")
                                                .maxDevices(10)
                                                .streamingQuality("N/A")
                                                .build(),

                                Subscription.builder()
                                                .name("Microsoft 365")
                                                .description("Microsoft Office apps, cloud storage, and productivity tools.")
                                                .logoUrl("https://www.microsoft.com/favicon.ico")
                                                .websiteUrl("https://www.microsoft.com/en-in/microsoft-365")
                                                .category("Productivity")
                                                .priceMonthly(489.0)
                                                .priceYearly(4899.0)
                                                .currency("INR")
                                                .features("Word, Excel, PowerPoint, 1TB OneDrive, Outlook")
                                                .maxDevices(5)
                                                .streamingQuality("N/A")
                                                .build());

                subscriptionRepository.saveAll(subscriptions);
                logger.info("Initialized {} subscriptions.", subscriptions.size());

                // Automatically scrape prices for newly added subscriptions
                logger.info("Triggering initial price scraping...");
                try {
                        priceScraperService.scrapeAllPrices();
                        logger.info("Initial price scraping completed.");
                } catch (Exception e) {
                        logger.warn("Initial price scraping failed: {}. Prices will be updated on next scheduled run.",
                                        e.getMessage());
                }
        }
}
