package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.dto.ReviewReplyRequest;
import com.mahesh.localserviceprovider.dto.ReviewRequest;
import com.mahesh.localserviceprovider.dto.ReviewResponse;
import com.mahesh.localserviceprovider.dto.ServiceRatingSummaryDto;
import com.mahesh.localserviceprovider.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CUSTOMER') or hasRole('CUSTOMER')")
    public ResponseEntity<?> createReview(
            @Valid @RequestBody ReviewRequest request,
            Principal principal) {
        try {
            ReviewResponse response = reviewService.createReview(request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByService(@PathVariable Long serviceId) {
        return ResponseEntity.ok(reviewService.getReviewsByService(serviceId));
    }

    @GetMapping("/service/{serviceId}/summary")
    public ResponseEntity<ServiceRatingSummaryDto> getServiceRatingSummary(@PathVariable Long serviceId) {
        return ResponseEntity.ok(reviewService.getServiceRatingSummary(serviceId));
    }

    // Endpoint for Provider to fetch all reviews left for their services
    @GetMapping("/provider")
    @PreAuthorize("hasAuthority('PROVIDER') or hasRole('PROVIDER')")
    public ResponseEntity<List<ReviewResponse>> getReviewsForProvider(Principal principal) {
        return ResponseEntity.ok(reviewService.getReviewsForProvider(principal.getName()));
    }

    // Step 5 Endpoint: Allows a Provider to reply to a review
    @PreAuthorize("hasAuthority('PROVIDER') or hasRole('PROVIDER')")
    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<?> replyToReview(
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewReplyRequest request,
            Principal principal) {
        try {
            ReviewResponse response = reviewService.replyToReview(reviewId, request, principal.getName());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}