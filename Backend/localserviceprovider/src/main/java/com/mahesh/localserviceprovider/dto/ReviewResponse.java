package com.mahesh.localserviceprovider.dto;

import java.time.LocalDateTime;

public class ReviewResponse {

    private Long id;
    private Long bookingId;
    private Long customerId;
    private String customerName;
    private Long serviceId;
    private Integer rating;
    private String comment;

    // --- Added for Step 3: Provider Reply Fields ---
    private String reply;
    private LocalDateTime replyCreatedAt;

    private LocalDateTime createdAt;

    public ReviewResponse() {}

    public ReviewResponse(Long id, Long bookingId, Long customerId, String customerName,
                          Long serviceId, Integer rating, String comment, LocalDateTime createdAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.serviceId = serviceId;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    // Constructor including reply fields
    public ReviewResponse(Long id, Long bookingId, Long customerId, String customerName,
                          Long serviceId, Integer rating, String comment, String reply,
                          LocalDateTime replyCreatedAt, LocalDateTime createdAt) {
        this.id = id;
        this.bookingId = bookingId;
        this.customerId = customerId;
        this.customerName = customerName;
        this.serviceId = serviceId;
        this.rating = rating;
        this.comment = comment;
        this.reply = reply;
        this.replyCreatedAt = replyCreatedAt;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    // --- Getters & Setters for Reply Fields ---
    public String getReply() { return reply; }
    public void setReply(String reply) { this.reply = reply; }

    public LocalDateTime getReplyCreatedAt() { return replyCreatedAt; }
    public void setReplyCreatedAt(LocalDateTime replyCreatedAt) { this.replyCreatedAt = replyCreatedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}