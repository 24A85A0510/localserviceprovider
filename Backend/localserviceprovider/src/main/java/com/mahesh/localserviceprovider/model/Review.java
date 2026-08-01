package com.mahesh.localserviceprovider.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;

    @Min(1)
    @Max(5)
    @Column(nullable = false)
    private Integer rating;

    @Column(length = 1000)
    private String comment;

    // --- Added for Step 1: Provider Reply Support ---
    @Column(length = 1000)
    private String reply;

    @Column(name = "reply_created_at")
    private LocalDateTime replyCreatedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Constructors
    public Review() {}

    public Review(Long id, Booking booking, User customer, ServiceEntity service, Integer rating, String comment, LocalDateTime createdAt) {
        this.id = id;
        this.booking = booking;
        this.customer = customer;
        this.service = service;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
    }

    // All-args constructor including reply fields
    public Review(Long id, Booking booking, User customer, ServiceEntity service, Integer rating, String comment, String reply, LocalDateTime replyCreatedAt, LocalDateTime createdAt) {
        this.id = id;
        this.booking = booking;
        this.customer = customer;
        this.service = service;
        this.rating = rating;
        this.comment = comment;
        this.reply = reply;
        this.replyCreatedAt = replyCreatedAt;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Booking getBooking() { return booking; }
    public void setBooking(Booking booking) { this.booking = booking; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public ServiceEntity getService() { return service; }
    public void setService(ServiceEntity service) { this.service = service; }

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