package com.mahesh.localserviceprovider.model;

public enum BookingStatus {
    PENDING,
    ACCEPTED,
    WAITING_APPROVAL, // Provider quoted the price; awaiting customer approval
    CONFIRMED,
    APPROVED,
    ON_THE_WAY,  // Trigger for Live Tracking
    REJECTED,
    CANCELLED,
    COMPLETED,
    PAID         // Trigger for completed payment phase
}