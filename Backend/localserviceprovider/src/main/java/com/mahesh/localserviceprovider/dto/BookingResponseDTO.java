package com.mahesh.localserviceprovider.dto;

import java.time.LocalDateTime;

public class BookingResponseDTO {

    private Long id;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private Long serviceId;
    private String serviceTitle;
    private LocalDateTime bookingDate;
    private String address;
    private String notes;
    private String status;
    private boolean reviewed;

    // --- Customer GPS Coordinates ---
    private Double customerLatitude;
    private Double customerLongitude;

    private String paymentStatus;
    private Double amount;

    public BookingResponseDTO() {}

    public BookingResponseDTO(Long id, Long customerId, String customerName, String customerEmail,
                              String customerPhone, Long serviceId, String serviceTitle,
                              LocalDateTime bookingDate, String address, String notes, String status, boolean reviewed,
                              Double customerLatitude, Double customerLongitude,
                              String paymentStatus, Double amount) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.serviceId = serviceId;
        this.serviceTitle = serviceTitle;
        this.bookingDate = bookingDate;
        this.address = address;
        this.notes = notes;
        this.status = status;
        this.reviewed = reviewed;
        this.customerLatitude = customerLatitude;
        this.customerLongitude = customerLongitude;
        this.paymentStatus = paymentStatus;
        this.amount = amount;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }

    public String getServiceTitle() { return serviceTitle; }
    public void setServiceTitle(String serviceTitle) { this.serviceTitle = serviceTitle; }

    public LocalDateTime getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDateTime bookingDate) { this.bookingDate = bookingDate; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isReviewed() { return reviewed; }
    public void setReviewed(boolean reviewed) { this.reviewed = reviewed; }

    public Double getCustomerLatitude() { return customerLatitude; }
    public void setCustomerLatitude(Double customerLatitude) { this.customerLatitude = customerLatitude; }

    public Double getCustomerLongitude() { return customerLongitude; }
    public void setCustomerLongitude(Double customerLongitude) { this.customerLongitude = customerLongitude; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
}