package com.mahesh.localserviceprovider.repository;

import com.mahesh.localserviceprovider.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    // 1. Primary method: Fetch bookings directly by the customer's User email
    @Query("SELECT b FROM Booking b WHERE b.customer.email = :email")
    List<Booking> findByCustomerEmail(@Param("email") String email);

    // 2. Fallback method: Fetch by customer user ID
    List<Booking> findByCustomerId(Long customerId);

    // 3. Provider lookup method
    List<Booking> findByService_ProviderId(Long providerId);
}