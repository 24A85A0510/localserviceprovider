package com.mahesh.localserviceprovider.dto;

public class ServiceRatingSummaryDto {
    private Long serviceId;
    private Double averageRating;
    private Long totalReviews;

    public ServiceRatingSummaryDto(Long serviceId, Double averageRating, Long totalReviews) {
        this.serviceId = serviceId;
        // Round to 1 decimal place (e.g., 4.5) or default to 0.0 if null
        this.averageRating = (averageRating != null) ? Math.round(averageRating * 10.0) / 10.0 : 0.0;
        this.totalReviews = (totalReviews != null) ? totalReviews : 0L;
    }

    // Getters and Setters
    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }

    public Double getAverageRating() { return averageRating; }
    public void setAverageRating(Double averageRating) { this.averageRating = averageRating; }

    public Long getTotalReviews() { return totalReviews; }
    public void setTotalReviews(Long totalReviews) { this.totalReviews = totalReviews; }
}