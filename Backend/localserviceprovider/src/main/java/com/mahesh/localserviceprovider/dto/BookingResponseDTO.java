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
    private String status;
    private boolean reviewed;

    public BookingResponseDTO() {}

    public BookingResponseDTO(Long id, Long customerId, String customerName, String customerEmail,
                              String customerPhone, Long serviceId, String serviceTitle,
                              LocalDateTime bookingDate, String address, String status, boolean reviewed) {
        this.id = id;
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerPhone = customerPhone;
        this.serviceId = serviceId;
        this.serviceTitle = serviceTitle;
        this.bookingDate = bookingDate;
        this.address = address;
        this.status = status;
        this.reviewed = reviewed;
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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isReviewed() { return reviewed; }
    public void setReviewed(boolean reviewed) { this.reviewed = reviewed; }
}