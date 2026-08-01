package com.mahesh.localserviceprovider.service;

import com.mahesh.localserviceprovider.dto.BookingRequestDTO;
import com.mahesh.localserviceprovider.dto.BookingResponseDTO;
import com.mahesh.localserviceprovider.dto.ProviderAnalyticsDTO;
import com.mahesh.localserviceprovider.model.Booking;
import com.mahesh.localserviceprovider.model.BookingStatus;
import com.mahesh.localserviceprovider.model.Notification;
import com.mahesh.localserviceprovider.model.ServiceEntity;
import com.mahesh.localserviceprovider.model.User;
import com.mahesh.localserviceprovider.repository.BookingRepository;
import com.mahesh.localserviceprovider.repository.NotificationRepository;
import com.mahesh.localserviceprovider.repository.ReviewRepository;
import com.mahesh.localserviceprovider.repository.ServiceRepository;
import com.mahesh.localserviceprovider.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationRepository notificationRepository;

    public BookingService(BookingRepository bookingRepository,
                          ServiceRepository serviceRepository,
                          UserRepository userRepository,
                          ReviewRepository reviewRepository,
                          NotificationRepository notificationRepository) {
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
        this.reviewRepository = reviewRepository;
        this.notificationRepository = notificationRepository;
    }

    // Create a new booking
    @Transactional
    public BookingResponseDTO createBooking(BookingRequestDTO dto, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found with email: " + customerEmail));

        ServiceEntity service = serviceRepository.findById(dto.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + dto.getServiceId()));

        if (Boolean.TRUE.equals(service.getIsDeleted())) {
            throw new RuntimeException("Cannot book a service that has been deleted");
        }

        Booking booking = new Booking(
                customer,
                service,
                dto.getBookingDate(),
                dto.getAddress(),
                BookingStatus.PENDING
        );

        Booking savedBooking = bookingRepository.save(booking);

        // 🔔 NOTIFICATION: Alert the provider about the new booking request
        User provider = service.getProvider();
        if (provider != null) {
            String message = String.format("New booking request from %s for service: %s",
                    customer.getName(), service.getTitle());
            notificationRepository.save(new Notification(provider.getId(), message));
        }

        return mapToDTO(savedBooking);
    }

    // Get all bookings across the platform for Admin management
    public List<BookingResponseDTO> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Get all bookings for the logged-in customer
    public List<BookingResponseDTO> getCustomerBookings(String customerEmail) {
        // Query directly by customer email to avoid ID mapping issues for Google OAuth users
        List<Booking> bookings = bookingRepository.findByCustomerEmail(customerEmail);

        // Fallback: search by customer ID if email lookup returns empty
        if (bookings.isEmpty()) {
            User customer = userRepository.findByEmail(customerEmail).orElse(null);
            if (customer != null) {
                bookings = bookingRepository.findByCustomerId(customer.getId());
            }
        }

        return bookings.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Get all bookings for services belonging to the logged-in provider
    public List<BookingResponseDTO> getProviderBookings(String providerEmail) {
        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new RuntimeException("Provider not found with email: " + providerEmail));

        return bookingRepository.findByService_ProviderId(provider.getId()).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    // Provider Analytics Dashboard Data
    public ProviderAnalyticsDTO getProviderAnalytics(String providerEmail) {
        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new RuntimeException("Provider not found with email: " + providerEmail));

        List<Booking> providerBookings = bookingRepository.findByService_ProviderId(provider.getId());

        long totalBookings = providerBookings.size();

        // Counts COMPLETED or PAID bookings
        long completedCount = providerBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.PAID)
                .count();

        long pendingCount = providerBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.PENDING)
                .count();

        // Sum earnings from COMPLETED or PAID bookings
        double totalEarnings = providerBookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.PAID)
                .mapToDouble(b -> b.getAmount() != null ? b.getAmount() :
                        ((b.getService() != null && b.getService().getPrice() != null) ? b.getService().getPrice() : 0.0))
                .sum();

        return new ProviderAnalyticsDTO(totalEarnings, completedCount, pendingCount, totalBookings);
    }

    // Cancel booking requested by Customer
    @Transactional
    public BookingResponseDTO cancelBooking(Long bookingId, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found with email: " + customerEmail));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        // Ownership Check: Ensure customer owns this booking
        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new RuntimeException("Unauthorized: You can only cancel your own bookings");
        }

        // State Check: Only allow cancelling if still PENDING
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only pending bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking updatedBooking = bookingRepository.save(booking);

        // 🔔 NOTIFICATION: Alert the service provider about the cancellation
        User provider = booking.getService().getProvider();
        if (provider != null) {
            String message = String.format("Booking for service '%s' was cancelled by the customer (%s).",
                    booking.getService().getTitle(), customer.getName());
            notificationRepository.save(new Notification(provider.getId(), message));
        }

        return mapToDTO(updatedBooking);
    }

    // Update booking status with provider ownership & lifecycle checks
    @Transactional
    public BookingResponseDTO updateBookingStatus(Long bookingId, BookingStatus newStatus, String providerEmail) {
        User provider = userRepository.findByEmail(providerEmail)
                .orElseThrow(() -> new RuntimeException("Provider not found with email: " + providerEmail));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        // Ownership Verification
        if (!booking.getService().getProvider().getId().equals(provider.getId())) {
            throw new RuntimeException("Unauthorized: You do not own the service associated with this booking");
        }

        // State Guard: Prevent changing status of completed, paid, or cancelled bookings
        if (booking.getStatus() == BookingStatus.COMPLETED ||
                booking.getStatus() == BookingStatus.PAID ||
                booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Cannot change status of a completed, paid, or cancelled booking");
        }

        booking.setStatus(newStatus);
        Booking updatedBooking = bookingRepository.save(booking);

        // 🔔 NOTIFICATION: Alert the customer about the updated booking status
        User customer = booking.getCustomer();
        if (customer != null) {
            String message = String.format("Your booking for '%s' has been marked as %s.",
                    booking.getService().getTitle(), newStatus.name());
            notificationRepository.save(new Notification(customer.getId(), message));
        }

        return mapToDTO(updatedBooking);
    }

    // 💳 Process booking payment from Customer
    @Transactional
    public BookingResponseDTO processBookingPayment(Long bookingId, Double amount, String transactionId, String customerEmail) {
        User customer = userRepository.findByEmail(customerEmail)
                .orElseThrow(() -> new RuntimeException("Customer not found with email: " + customerEmail));

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + bookingId));

        // Ensure customer owns the booking
        if (!booking.getCustomer().getId().equals(customer.getId())) {
            throw new RuntimeException("Unauthorized: You can only pay for your own bookings");
        }

        // Apply payment updates
        booking.setPaymentStatus("PAID");
        booking.setPaymentId(transactionId);
        booking.setAmount(amount);
        booking.setStatus(BookingStatus.PAID);

        Booking updatedBooking = bookingRepository.save(booking);

        // 🔔 NOTIFICATION: Notify Provider that payment has been completed
        User provider = booking.getService().getProvider();
        if (provider != null) {
            String message = String.format("Payment received! %s paid ₹%.2f for service: %s (Txn ID: %s)",
                    customer.getName(), amount, booking.getService().getTitle(), transactionId);
            notificationRepository.save(new Notification(provider.getId(), message));
        }

        return mapToDTO(updatedBooking);
    }

    // Helper method to convert Booking Entity to BookingResponseDTO
    private BookingResponseDTO mapToDTO(Booking booking) {
        boolean isReviewed = reviewRepository.existsByBookingId(booking.getId());

        User customer = booking.getCustomer();
        String name = (customer != null) ? customer.getName() : "N/A";
        String email = (customer != null) ? customer.getEmail() : "N/A";
        String phone = (customer != null && customer.getPhone() != null) ? customer.getPhone() : "N/A";

        return new BookingResponseDTO(
                booking.getId(),
                booking.getCustomer().getId(),
                name,
                email,
                phone,
                booking.getService().getId(),
                booking.getService().getTitle(),
                booking.getBookingDate(),
                booking.getAddress(),
                booking.getStatus().name(),
                isReviewed
        );
    }
}