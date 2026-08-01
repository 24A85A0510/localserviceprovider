package com.mahesh.localserviceprovider.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public class BookingRequestDTO {

    @NotNull(message = "Service ID is required")
    private Long serviceId;

    @NotNull(message = "Booking date is required")
    @Future(message = "Booking date and time must be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm[:ss]")
    private LocalDateTime bookingDate;

    @NotBlank(message = "Address is required")
    @Size(min = 5, max = 255, message = "Address must be between 5 and 255 characters")
    private String address;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    public BookingRequestDTO() {}

    public BookingRequestDTO(Long serviceId, LocalDateTime bookingDate, String address, String notes) {
        this.serviceId = serviceId;
        this.bookingDate = bookingDate;
        this.address = address;
        this.notes = notes;
    }

    public Long getServiceId() { return serviceId; }
    public void setServiceId(Long serviceId) { this.serviceId = serviceId; }

    public LocalDateTime getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDateTime bookingDate) { this.bookingDate = bookingDate; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}