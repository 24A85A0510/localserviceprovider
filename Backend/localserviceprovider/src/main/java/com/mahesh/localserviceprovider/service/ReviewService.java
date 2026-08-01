package com.mahesh.localserviceprovider.service;

import com.mahesh.localserviceprovider.dto.ReviewReplyRequest;
import com.mahesh.localserviceprovider.dto.ReviewRequest;
import com.mahesh.localserviceprovider.dto.ReviewResponse;
import com.mahesh.localserviceprovider.dto.ServiceRatingSummaryDto;
import com.mahesh.localserviceprovider.model.Booking;
import com.mahesh.localserviceprovider.model.BookingStatus;
import com.mahesh.localserviceprovider.model.Notification;
import com.mahesh.localserviceprovider.model.Review;
import com.mahesh.localserviceprovider.model.User;
import com.mahesh.localserviceprovider.repository.BookingRepository;
import com.mahesh.localserviceprovider.repository.NotificationRepository;
import com.mahesh.localserviceprovider.repository.ReviewRepository;
import com.mahesh.localserviceprovider.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository; // Injected NotificationRepository

    public ReviewService(ReviewRepository reviewRepository,
                         BookingRepository bookingRepository,
                         UserRepository userRepository,
                         NotificationRepository notificationRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public ReviewResponse createReview(ReviewRequest request, String customerEmail) {
        // 1. Duplicate Review Guard
        if (reviewRepository.findByBookingId(request.getBookingId()).isPresent()) {
            throw new RuntimeException("Review already exists for this booking");
        }

        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // 2. Ownership Guard: Ensure customer owns the booking
        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new RuntimeException("Unauthorized: You can only review your own bookings");
        }

        // 3. Lifecycle Guard: Ensure booking status is COMPLETED
        if (booking.getStatus() != BookingStatus.COMPLETED) {
            throw new RuntimeException("Cannot review a booking that is not completed. Current status: " + booking.getStatus());
        }

        Review review = new Review();
        review.setBooking(booking);
        review.setCustomer(customer);
        review.setService(booking.getService());
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setCreatedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);

        // 🔔 NOTIFICATION: Alert provider about the new review
        User provider = booking.getService().getProvider();
        if (provider != null) {
            String message = String.format("New %d⭐ review from %s for service: %s",
                    savedReview.getRating(), customer.getName(), booking.getService().getTitle());
            notificationRepository.save(new Notification(provider.getId(), message));
        }

        return mapToResponse(savedReview);
    }

    public List<ReviewResponse> getReviewsByService(Long serviceId) {
        return reviewRepository.findByServiceId(serviceId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ServiceRatingSummaryDto getServiceRatingSummary(Long serviceId) {
        Double avgRating = reviewRepository.findAverageRatingByServiceId(serviceId);
        Long totalReviews = reviewRepository.countByServiceId(serviceId);

        return new ServiceRatingSummaryDto(serviceId, avgRating, totalReviews);
    }

    // Retrieves all reviews submitted for any service owned by the logged-in provider
    public List<ReviewResponse> getReviewsForProvider(String providerEmail) {
        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        return reviewRepository.findByServiceProviderId(provider.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // Allows a Provider to reply to a review on their service
    @Transactional
    public ReviewResponse replyToReview(Long reviewId, ReviewReplyRequest replyRequest, String providerEmail) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        // 1. Ownership Guard: Check if provider owns the service associated with this review
        if (!review.getService().getProvider().getId().equals(provider.getId())) {
            throw new RuntimeException("Unauthorized: You can only reply to reviews for your own services");
        }

        // 2. Single-Reply Guard: Prevent duplicate replies
        if (review.getReply() != null) {
            throw new RuntimeException("A reply has already been submitted for this review");
        }

        review.setReply(replyRequest.getReply());
        review.setReplyCreatedAt(LocalDateTime.now());

        Review updatedReview = reviewRepository.save(review);

        // 🔔 NOTIFICATION: Alert customer that provider replied to their review
        User customer = review.getCustomer();
        if (customer != null) {
            String message = String.format("The provider replied to your review on '%s'.",
                    review.getService().getTitle());
            notificationRepository.save(new Notification(customer.getId(), message));
        }

        return mapToResponse(updatedReview);
    }

    private ReviewResponse mapToResponse(Review review) {
        ReviewResponse response = new ReviewResponse();
        response.setId(review.getId());
        response.setBookingId(review.getBooking().getId());
        response.setCustomerId(review.getCustomer().getId());
        response.setCustomerName(review.getCustomer().getName());
        response.setServiceId(review.getService().getId());
        response.setRating(review.getRating());
        response.setComment(review.getComment());

        // Map reply fields
        response.setReply(review.getReply());
        response.setReplyCreatedAt(review.getReplyCreatedAt());

        response.setCreatedAt(review.getCreatedAt());
        return response;
    }
}