package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.dto.BookingResponseDTO;
import com.mahesh.localserviceprovider.dto.PaymentRequestDTO;
import com.mahesh.localserviceprovider.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/payments")
@Tag(name = "Payment Controller", description = "Endpoints for processing service payments")
public class PaymentController {

    @Autowired
    private BookingService bookingService;

    @PostMapping("/process")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Process payment for a completed service booking")
    public ResponseEntity<BookingResponseDTO> processPayment(
            @Valid @RequestBody PaymentRequestDTO paymentRequest,
            Authentication authentication) {

        String customerEmail = authentication.getName();

        // Generate mock transaction reference ID
        String transactionId = "TXN_" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        BookingResponseDTO updatedBooking = bookingService.processBookingPayment(
                paymentRequest.getBookingId(),
                paymentRequest.getAmount(),
                transactionId,
                customerEmail
        );

        return ResponseEntity.ok(updatedBooking);
    }
}