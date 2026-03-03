package com.subscriptiontracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = { MailSenderAutoConfiguration.class })
@EnableScheduling
public class SubscriptionTrackerBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SubscriptionTrackerBackendApplication.class, args);
    }
}