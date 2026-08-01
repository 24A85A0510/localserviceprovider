package com.mahesh.localserviceprovider.repository;

import com.mahesh.localserviceprovider.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByServiceId(Long serviceId);

    // Derived query to fetch all reviews for services provided by a specific provider
    List<Review> findByServiceProviderId(Long providerId);

    Optional<Review> findByBookingId(Long bookingId);

    // Added for Double-Review Guard check
    boolean existsByBookingId(Long bookingId);

    // Fixed JPQL path: changed r.serviceId to r.service.id
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.service.id = :serviceId")
    Double findAverageRatingByServiceId(@Param("serviceId") Long serviceId);

    Long countByServiceId(Long serviceId);
}