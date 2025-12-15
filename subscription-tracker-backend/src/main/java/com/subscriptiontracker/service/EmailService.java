package com.subscriptiontracker.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.from-name:Subscription Tracker}")
    private String fromName;

    /**
     * Send a simple HTML email
     */
    @Async
    public void sendEmail(String toEmail, String subject, String htmlBody) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            mailSender.send(message);
            logger.info("Email sent successfully to {}", toEmail);

        } catch (MessagingException e) {
            logger.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        } catch (Exception e) {
            logger.error("Error sending email to {}: {}", toEmail, e.getMessage());
        }
    }

    /**
     * Send renewal reminder email
     */
    @Async
    public void sendRenewalReminderEmail(String toEmail, String userName,
            String subscriptionName, String renewalDate,
            Double amount) {
        String subject = "🔔 Subscription Renewal Reminder - " + subscriptionName;
        String body = buildRenewalReminderTemplate(userName, subscriptionName, renewalDate, amount);
        sendEmail(toEmail, subject, body);
    }

    /**
     * Send price drop alert email
     */
    @Async
    public void sendPriceDropEmail(String toEmail, String userName,
            String subscriptionName, Double oldPrice,
            Double newPrice) {
        String subject = "🎉 Price Drop Alert - " + subscriptionName;
        String body = buildPriceDropTemplate(userName, subscriptionName, oldPrice, newPrice);
        sendEmail(toEmail, subject, body);
    }

    /**
     * Send welcome email
     */
    @Async
    public void sendWelcomeEmail(String toEmail, String userName) {
        String subject = "Welcome to Subscription Tracker! 🎊";
        String body = buildWelcomeTemplate(userName);
        sendEmail(toEmail, subject, body);
    }

    /**
     * Send OTP verification email
     */
    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "🔐 Your Verification Code - Subscription Tracker";
        String body = buildOtpTemplate(otpCode);
        // Send synchronously for OTP (not @Async) to ensure delivery before response
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true);

            mailSender.send(message);
            logger.info("OTP email sent successfully to {}", toEmail);

        } catch (Exception e) {
            logger.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send OTP email");
        }
    }

    /**
     * Build OTP email HTML template
     */
    private String buildOtpTemplate(String otpCode) {
        return String.format(
                """
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; text-align: center; }
                                .otp-box { background: #fff; padding: 30px; border-radius: 10px;
                                           border: 2px dashed #667eea; margin: 20px 0; }
                                .otp-code { font-size: 42px; font-weight: bold; color: #667eea;
                                            letter-spacing: 8px; font-family: 'Courier New', monospace; }
                                .warning { background: #fff3cd; color: #856404; padding: 15px;
                                           border-radius: 8px; margin-top: 20px; font-size: 14px; }
                                .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>🔐 Email Verification</h1>
                                    <p>Confirm your email to create your account</p>
                                </div>
                                <div class="content">
                                    <p>Use the verification code below to complete your registration:</p>

                                    <div class="otp-box">
                                        <p style="margin: 0 0 10px 0; color: #666;">Your verification code is:</p>
                                        <div class="otp-code">%s</div>
                                    </div>

                                    <p>This code will expire in <strong>10 minutes</strong>.</p>

                                    <div class="warning">
                                        ⚠️ If you didn't request this code, please ignore this email.
                                        Someone may have entered your email address by mistake.
                                    </div>
                                </div>
                                <div class="footer">
                                    <p>© 2024 Subscription Tracker. All rights reserved.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        """,
                otpCode);
    }

    /**
     * Build renewal reminder HTML template
     */
    private String buildRenewalReminderTemplate(String userName, String subscriptionName,
            String renewalDate, Double amount) {
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                                  color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .highlight { background: #fff; padding: 20px; border-radius: 8px;
                                     border-left: 4px solid #667eea; margin: 20px 0; }
                        .amount { font-size: 28px; color: #667eea; font-weight: bold; }
                        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔔 Renewal Reminder</h1>
                        </div>
                        <div class="content">
                            <p>Hi %s,</p>
                            <p>This is a friendly reminder that your subscription is coming up for renewal.</p>

                            <div class="highlight">
                                <h3>%s</h3>
                                <p><strong>Renewal Date:</strong> %s</p>
                                <p><strong>Amount:</strong> <span class="amount">₹%.2f</span></p>
                            </div>

                            <p>Make sure you have sufficient balance in your account for the renewal.</p>
                        </div>
                        <div class="footer">
                            <p>You're receiving this because you enabled renewal reminders.</p>
                            <p>© 2024 Subscription Tracker. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, userName, subscriptionName, renewalDate, amount);
    }

    /**
     * Build price drop HTML template
     */
    private String buildPriceDropTemplate(String userName, String subscriptionName,
            Double oldPrice, Double newPrice) {
        double savings = oldPrice - newPrice;
        double percentageDrop = (savings / oldPrice) * 100;

        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #11998e 0%%, #38ef7d 100%%);
                                  color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .price-box { background: #fff; padding: 20px; border-radius: 8px;
                                     text-align: center; margin: 20px 0; }
                        .old-price { font-size: 20px; color: #999; text-decoration: line-through; }
                        .new-price { font-size: 36px; color: #11998e; font-weight: bold; }
                        .savings { background: #e8f5e9; color: #2e7d32; padding: 10px 20px;
                                   border-radius: 20px; display: inline-block; margin-top: 10px; }
                        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎉 Price Drop Alert!</h1>
                        </div>
                        <div class="content">
                            <p>Hi %s,</p>
                            <p>Great news! A subscription on your watchlist just got cheaper!</p>

                            <div class="price-box">
                                <h2>%s</h2>
                                <p class="old-price">₹%.2f</p>
                                <p class="new-price">₹%.2f</p>
                                <p class="savings">You save ₹%.2f (%.1f%% off)!</p>
                            </div>

                            <p>This might be the perfect time to subscribe!</p>
                        </div>
                        <div class="footer">
                            <p>You're receiving this because you enabled price drop alerts.</p>
                            <p>© 2024 Subscription Tracker. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, userName, subscriptionName, oldPrice, newPrice, savings, percentageDrop);
    }

    /**
     * Build welcome HTML template
     */
    private String buildWelcomeTemplate(String userName) {
        return String.format("""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
                                  color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .feature { background: #fff; padding: 15px; border-radius: 8px; margin: 10px 0; }
                        .feature-icon { font-size: 24px; margin-right: 15px; }
                        .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to Subscription Tracker! 🎊</h1>
                            <p>Your personal subscription management assistant</p>
                        </div>
                        <div class="content">
                            <p>Hi %s,</p>
                            <p>Thank you for joining Subscription Tracker! Here's what you can do:</p>

                            <div class="feature">
                                <span class="feature-icon">📊</span>
                                <strong>Track Your Subscriptions</strong> - Keep all your subscriptions in one place
                            </div>

                            <div class="feature">
                                <span class="feature-icon">💰</span>
                                <strong>Manage Your Budget</strong> - See how much you're spending
                            </div>

                            <div class="feature">
                                <span class="feature-icon">🔔</span>
                                <strong>Get Renewal Reminders</strong> - Never miss a renewal date
                            </div>

                            <div class="feature">
                                <span class="feature-icon">📉</span>
                                <strong>Price Drop Alerts</strong> - Get notified when prices drop
                            </div>
                        </div>
                        <div class="footer">
                            <p>© 2024 Subscription Tracker. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """, userName);
    }
}