package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.dto.BookingRequestDTO;
import com.mahesh.localserviceprovider.dto.BookingResponseDTO;
import com.mahesh.localserviceprovider.dto.ProviderAnalyticsDTO;
import com.mahesh.localserviceprovider.model.BookingStatus;
import com.mahesh.localserviceprovider.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"}, allowCredentials = "true")
@Tag(name = "Booking Controller", description = "Endpoints for managing customer and provider bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    /**
     * Helper method to extract the user's email/username safely from the Authentication object.
     */
    private String extractEmail(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        return authentication.getName();
    }

    // POST /api/bookings - Customer creates a new booking
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER', 'CUSTOMER')")
    @Operation(summary = "Create a new booking request (Customer only)")
    public ResponseEntity<?> createBooking(
            @Valid @RequestBody BookingRequestDTO requestDTO,
            Authentication authentication) {

        String customerEmail = extractEmail(authentication);
        if (customerEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication is missing or invalid.");
        }

        BookingResponseDTO response = bookingService.createBooking(requestDTO, customerEmail);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    // GET /api/bookings/customer - Customer views their own bookings
    @GetMapping("/customer")
    @PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER', 'CUSTOMER')")
    @Operation(summary = "View customer's own booking history")
    public ResponseEntity<?> getCustomerBookings(Authentication authentication) {
        String customerEmail = extractEmail(authentication);
        if (customerEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication is missing or invalid.");
        }

        List<BookingResponseDTO> bookings = bookingService.getCustomerBookings(customerEmail);
        return ResponseEntity.ok(bookings);
    }

    // GET /api/bookings/provider - Provider views incoming booking requests
    @GetMapping("/provider")
    @PreAuthorize("hasAnyAuthority('ROLE_PROVIDER', 'PROVIDER')")
    @Operation(summary = "View provider's incoming booking requests")
    public ResponseEntity<?> getProviderBookings(Authentication authentication) {
        String providerEmail = extractEmail(authentication);
        if (providerEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication is missing or invalid.");
        }

        List<BookingResponseDTO> bookings = bookingService.getProviderBookings(providerEmail);
        return ResponseEntity.ok(bookings);
    }

    // GET /api/bookings/provider/analytics - Provider views business metrics
    @GetMapping("/provider/analytics")
    @PreAuthorize("hasAnyAuthority('ROLE_PROVIDER', 'PROVIDER')")
    @Operation(summary = "View provider's business metrics and earnings summary")
    public ResponseEntity<?> getProviderAnalytics(Authentication authentication) {
        String providerEmail = extractEmail(authentication);
        if (providerEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication is missing or invalid.");
        }

        ProviderAnalyticsDTO analytics = bookingService.getProviderAnalytics(providerEmail);
        return ResponseEntity.ok(analytics);
    }

    // PUT /api/bookings/{id}/status - Update booking status
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_CUSTOMER', 'CUSTOMER', 'ROLE_PROVIDER', 'PROVIDER')")
    @Operation(summary = "Update booking status across workflow phases")
    public ResponseEntity<?> updateBookingStatus(
            @PathVariable Long id,
            @RequestParam("status") String statusStr,
            Authentication authentication) {

        String userEmail = extractEmail(authentication);
        if (userEmail == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User authentication is missing or invalid.");
        }

        BookingStatus status;
        try {
            String cleanedStatus = statusStr.trim().replaceAll("^\"|\"$", "").toUpperCase();
            status = BookingStatus.valueOf(cleanedStatus);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    "Invalid status value provided: '" + statusStr + "'. Expected one of: " +
                            Arrays.toString(BookingStatus.values())
            );
        }

        boolean isCustomer = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_CUSTOMER") || role.equals("CUSTOMER"));

        if (isCustomer) {
            if (status != BookingStatus.CANCELLED) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Customers are only permitted to cancel their bookings.");
            }
            BookingResponseDTO updated = bookingService.cancelBooking(id, userEmail);
            return ResponseEntity.ok(updated);
        } else {
            BookingResponseDTO updated = bookingService.updateBookingStatus(id, status, userEmail);
            return ResponseEntity.ok(updated);
        }
    }
}