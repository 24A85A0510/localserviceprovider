package com.mahesh.localserviceprovider.dto;

public class ProviderAnalyticsDTO {

    private double totalEarnings;
    private long completedBookingsCount;
    private long pendingBookingsCount;
    private long totalBookingsCount;

    public ProviderAnalyticsDTO() {}

    public ProviderAnalyticsDTO(double totalEarnings, long completedBookingsCount, long pendingBookingsCount, long totalBookingsCount) {
        this.totalEarnings = totalEarnings;
        this.completedBookingsCount = completedBookingsCount;
        this.pendingBookingsCount = pendingBookingsCount;
        this.totalBookingsCount = totalBookingsCount;
    }

    // Getters and Setters
    public double getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(double totalEarnings) { this.totalEarnings = totalEarnings; }

    public long getCompletedBookingsCount() { return completedBookingsCount; }
    public void setCompletedBookingsCount(long completedBookingsCount) { this.completedBookingsCount = completedBookingsCount; }

    public long getPendingBookingsCount() { return pendingBookingsCount; }
    public void setPendingBookingsCount(long pendingBookingsCount) { this.pendingBookingsCount = pendingBookingsCount; }

    public long getTotalBookingsCount() { return totalBookingsCount; }
    public void setTotalBookingsCount(long totalBookingsCount) { this.totalBookingsCount = totalBookingsCount; }
}