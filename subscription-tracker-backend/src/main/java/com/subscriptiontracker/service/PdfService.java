package com.subscriptiontracker.service;

import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.subscriptiontracker.dto.BudgetSummaryDTO;
import com.subscriptiontracker.dto.UserSubscriptionDTO;
import com.subscriptiontracker.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class PdfService {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserSubscriptionService userSubscriptionService;

    @Autowired
    private BudgetService budgetService;

    // Colors - Use Color type (parent class) for flexibility
    private static final Color PRIMARY_COLOR = new DeviceRgb(102, 126, 234);
    private static final Color SECONDARY_COLOR = new DeviceRgb(118, 75, 162);
    private static final Color LIGHT_GRAY = new DeviceRgb(245, 245, 245);
    private static final Color SUCCESS_COLOR = new DeviceRgb(46, 125, 50);
    private static final Color WARNING_COLOR = new DeviceRgb(237, 108, 2);
    private static final Color ERROR_COLOR = new DeviceRgb(211, 47, 47);
    private static final Color WHITE_COLOR = new DeviceRgb(255, 255, 255);
    private static final Color GRAY_TEXT = new DeviceRgb(136, 136, 136);
    private static final Color BORDER_COLOR = new DeviceRgb(224, 224, 224);

    /**
     * Generate subscription report PDF
     */
    public byte[] generateSubscriptionReport() throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf, PageSize.A4);
        document.setMargins(40, 40, 40, 40);

        try {
            User user = authService.getCurrentUser();
            List<UserSubscriptionDTO> subscriptions = userSubscriptionService.getUserSubscriptions();
            BudgetSummaryDTO budgetSummary = budgetService.getBudgetSummary();

            PdfFont boldFont = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regularFont = PdfFontFactory.createFont(StandardFonts.HELVETICA);

            // Header
            addHeader(document, boldFont, user.getName());

            // Summary Section
            addSummarySection(document, boldFont, regularFont, budgetSummary);

            // Subscriptions Table
            addSubscriptionsTable(document, boldFont, regularFont, subscriptions);

            // Budget Details
            addBudgetDetails(document, boldFont, regularFont, budgetSummary);

            // Footer
            addFooter(document, regularFont);

            document.close();

        } catch (Exception e) {
            document.close();
            throw new IOException("Error generating PDF: " + e.getMessage());
        }

        return baos.toByteArray();
    }

    /**
     * Add header to document
     */
    private void addHeader(Document document, PdfFont boldFont, String userName) {
        // Title
        Paragraph title = new Paragraph("Subscription Tracker Report")
                .setFont(boldFont)
                .setFontSize(24)
                .setFontColor(PRIMARY_COLOR)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(title);

        // Subtitle
        Paragraph subtitle = new Paragraph("Generated for: " + userName)
                .setFontSize(12)
                .setFontColor(GRAY_TEXT)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(subtitle);

        // Date
        Paragraph date = new Paragraph("Report Date: " +
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMMM yyyy")))
                .setFontSize(10)
                .setFontColor(GRAY_TEXT)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(20);
        document.add(date);

        // Divider
        addDivider(document);
    }

    /**
     * Add summary section
     */
    private void addSummarySection(Document document, PdfFont boldFont,
                                   PdfFont regularFont, BudgetSummaryDTO summary) {
        Paragraph sectionTitle = new Paragraph("Summary")
                .setFont(boldFont)
                .setFontSize(16)
                .setFontColor(PRIMARY_COLOR)
                .setMarginTop(20)
                .setMarginBottom(10);
        document.add(sectionTitle);

        // Summary table
        Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{1, 1, 1, 1}))
                .setWidth(UnitValue.createPercentValue(100));

        // Monthly Income
        summaryTable.addCell(createSummaryCell("Monthly Income",
                formatCurrency(summary.getMonthlyIncome()), SUCCESS_COLOR, boldFont, regularFont));

        // Monthly Expenses
        summaryTable.addCell(createSummaryCell("Monthly Expenses",
                formatCurrency(summary.getMonthlyExpenses()), WARNING_COLOR, boldFont, regularFont));

        // Subscription Total
        summaryTable.addCell(createSummaryCell("Subscriptions",
                formatCurrency(summary.getSubscriptionTotal()), PRIMARY_COLOR, boldFont, regularFont));

        // Remaining Budget
        Color remainingColor = summary.getRemainingBudget() >= 0 ? SUCCESS_COLOR : ERROR_COLOR;
        summaryTable.addCell(createSummaryCell("Remaining",
                formatCurrency(summary.getRemainingBudget()), remainingColor, boldFont, regularFont));

        document.add(summaryTable);
    }

    /**
     * Create summary cell
     */
    private Cell createSummaryCell(String label, String value, Color color,
                                   PdfFont boldFont, PdfFont regularFont) {
        Cell cell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setBackgroundColor(LIGHT_GRAY)
                .setPadding(15)
                .setMargin(5);

        Paragraph labelPara = new Paragraph(label)
                .setFont(regularFont)
                .setFontSize(10)
                .setFontColor(GRAY_TEXT);
        cell.add(labelPara);

        Paragraph valuePara = new Paragraph(value)
                .setFont(boldFont)
                .setFontSize(16)
                .setFontColor(color);
        cell.add(valuePara);

        return cell;
    }

    /**
     * Add subscriptions table
     */
    private void addSubscriptionsTable(Document document, PdfFont boldFont,
                                       PdfFont regularFont, List<UserSubscriptionDTO> subscriptions) {
        Paragraph sectionTitle = new Paragraph("Active Subscriptions")
                .setFont(boldFont)
                .setFontSize(16)
                .setFontColor(PRIMARY_COLOR)
                .setMarginTop(30)
                .setMarginBottom(10);
        document.add(sectionTitle);

        if (subscriptions.isEmpty()) {
            Paragraph noSubs = new Paragraph("No active subscriptions found.")
                    .setFont(regularFont)
                    .setFontColor(GRAY_TEXT)
                    .setMarginBottom(20);
            document.add(noSubs);
            return;
        }

        // Table
        Table table = new Table(UnitValue.createPercentArray(new float[]{2, 1.5f, 1.5f, 1.5f, 1.5f}))
                .setWidth(UnitValue.createPercentValue(100));

        // Header row
        String[] headers = {"Subscription", "Type", "Price", "Renewal Date", "Days Left"};
        for (String header : headers) {
            Cell headerCell = new Cell()
                    .add(new Paragraph(header).setFont(boldFont).setFontSize(10))
                    .setBackgroundColor(PRIMARY_COLOR)
                    .setFontColor(WHITE_COLOR)
                    .setPadding(10)
                    .setBorder(Border.NO_BORDER);
            table.addHeaderCell(headerCell);
        }

        // Data rows
        boolean alternate = false;
        for (UserSubscriptionDTO sub : subscriptions) {
            Color bgColor = alternate ? LIGHT_GRAY : WHITE_COLOR;

            table.addCell(createDataCell(sub.getSubscriptionName(), regularFont, bgColor));
            table.addCell(createDataCell(sub.getSubscriptionType(), regularFont, bgColor));

            Double price = sub.getCustomPrice() != null ? sub.getCustomPrice() : sub.getOriginalPrice();
            table.addCell(createDataCell(formatCurrency(price), regularFont, bgColor));

            String renewalDate = sub.getRenewalDate() != null ?
                    sub.getRenewalDate().format(DateTimeFormatter.ofPattern("dd MMM yyyy")) : "N/A";
            table.addCell(createDataCell(renewalDate, regularFont, bgColor));

            String daysLeft = sub.getDaysUntilRenewal() != null ?
                    sub.getDaysUntilRenewal() + " days" : "N/A";
            table.addCell(createDataCell(daysLeft, regularFont, bgColor));

            alternate = !alternate;
        }

        document.add(table);

        // Total
        Double totalCost = subscriptions.stream()
                .mapToDouble(s -> s.getCustomPrice() != null ? s.getCustomPrice() :
                        (s.getOriginalPrice() != null ? s.getOriginalPrice() : 0))
                .sum();

        Paragraph totalPara = new Paragraph("Total Monthly Cost: " + formatCurrency(totalCost))
                .setFont(boldFont)
                .setFontSize(12)
                .setFontColor(PRIMARY_COLOR)
                .setTextAlignment(TextAlignment.RIGHT)
                .setMarginTop(10);
        document.add(totalPara);
    }

    /**
     * Create data cell
     */
    private Cell createDataCell(String text, PdfFont font, Color bgColor) {
        return new Cell()
                .add(new Paragraph(text).setFont(font).setFontSize(9))
                .setBackgroundColor(bgColor)
                .setPadding(8)
                .setBorder(new SolidBorder(BORDER_COLOR, 0.5f));
    }

    /**
     * Add budget details
     */
    private void addBudgetDetails(Document document, PdfFont boldFont,
                                  PdfFont regularFont, BudgetSummaryDTO summary) {
        Paragraph sectionTitle = new Paragraph("Budget Analysis")
                .setFont(boldFont)
                .setFontSize(16)
                .setFontColor(PRIMARY_COLOR)
                .setMarginTop(30)
                .setMarginBottom(10);
        document.add(sectionTitle);

        // Budget usage percentage
        Double usagePercent = summary.getBudgetPercentageUsed();
        String usageStatus = getUsageStatus(usagePercent);
        Color statusColor = getStatusColor(usagePercent);

        Paragraph usage = new Paragraph(String.format("Budget Usage: %.1f%% (%s)", usagePercent, usageStatus))
                .setFont(boldFont)
                .setFontSize(14)
                .setFontColor(statusColor)
                .setMarginBottom(10);
        document.add(usage);

        // Breakdown
        Table breakdownTable = new Table(UnitValue.createPercentArray(new float[]{2, 1}))
                .setWidth(UnitValue.createPercentValue(50));

        addBreakdownRow(breakdownTable, "Monthly Income:",
                formatCurrency(summary.getMonthlyIncome()), regularFont);
        addBreakdownRow(breakdownTable, "Monthly Expenses:",
                formatCurrency(summary.getMonthlyExpenses()), regularFont);
        addBreakdownRow(breakdownTable, "Subscription Costs:",
                formatCurrency(summary.getSubscriptionTotal()), regularFont);
        addBreakdownRow(breakdownTable, "Remaining Budget:",
                formatCurrency(summary.getRemainingBudget()), regularFont);

        document.add(breakdownTable);
    }

    /**
     * Get usage status text
     */
    private String getUsageStatus(Double usagePercent) {
        if (usagePercent < 50) return "Excellent";
        if (usagePercent < 75) return "Good";
        if (usagePercent < 90) return "Moderate";
        return "High";
    }

    /**
     * Get status color based on usage percentage
     */
    private Color getStatusColor(Double usagePercent) {
        if (usagePercent < 50) return SUCCESS_COLOR;
        if (usagePercent < 75) return PRIMARY_COLOR;
        if (usagePercent < 90) return WARNING_COLOR;
        return ERROR_COLOR;
    }

    /**
     * Add breakdown row
     */
    private void addBreakdownRow(Table table, String label, String value, PdfFont font) {
        table.addCell(new Cell()
                .add(new Paragraph(label).setFont(font).setFontSize(10))
                .setBorder(Border.NO_BORDER)
                .setPadding(5));
        table.addCell(new Cell()
                .add(new Paragraph(value).setFont(font).setFontSize(10))
                .setBorder(Border.NO_BORDER)
                .setPadding(5)
                .setTextAlignment(TextAlignment.RIGHT));
    }

    /**
     * Add divider
     */
    private void addDivider(Document document) {
        Table divider = new Table(1).setWidth(UnitValue.createPercentValue(100));
        Cell cell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(BORDER_COLOR, 1))
                .setHeight(1);
        divider.addCell(cell);
        document.add(divider);
    }

    /**
     * Add footer
     */
    private void addFooter(Document document, PdfFont font) {
        addDivider(document);

        Paragraph footer = new Paragraph("Generated by Subscription Tracker | " +
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .setFont(font)
                .setFontSize(8)
                .setFontColor(GRAY_TEXT)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(20);
        document.add(footer);

        Paragraph disclaimer = new Paragraph("This report is for personal reference only.")
                .setFont(font)
                .setFontSize(8)
                .setFontColor(GRAY_TEXT)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(disclaimer);
    }

    /**
     * Format currency to INR
     */
    private String formatCurrency(Double amount) {
        if (amount == null) return "₹0.00";
        return String.format("₹%.2f", amount);
    }
}