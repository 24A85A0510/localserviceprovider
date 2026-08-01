package com.mahesh.localserviceprovider.dto;

import jakarta.validation.constraints.NotNull;

public class PaymentRequestDTO {

    @NotNull(message = "Booking ID is required")
    private Long bookingId;

    @NotNull(message = "Amount is required")
    private Double amount;

    private String paymentMethod; // e.g., "CARD", "UPI", "NET_BANKING"

    public PaymentRequestDTO() {}

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
}