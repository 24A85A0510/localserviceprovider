package com.mahesh.localserviceprovider.model;

public enum BookingStatus {
    PENDING,
    ACCEPTED,
    CONFIRMED,
    APPROVED,
    ON_THE_WAY,  // Trigger for Live Tracking
    REJECTED,
    CANCELLED,
    COMPLETED,
    PAID         // Trigger for completed payment phase
}