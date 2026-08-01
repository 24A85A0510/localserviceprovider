package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.dto.BookingResponseDTO;
import com.mahesh.localserviceprovider.dto.ServiceDTO;
import com.mahesh.localserviceprovider.dto.UserResponseDTO;
import com.mahesh.localserviceprovider.service.BookingService;
import com.mahesh.localserviceprovider.service.ServiceOfferingService;
import com.mahesh.localserviceprovider.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
public class AdminController {

    @Autowired
    private UserService userService;

    @Autowired
    private ServiceOfferingService serviceOfferingService;

    @Autowired
    private BookingService bookingService;

    // 1. Get all registered users
    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // 2. Get all services (Admin View) -> Returns ServiceDTO
    @GetMapping("/services")
    public ResponseEntity<List<ServiceDTO>> getAllServices() {
        return ResponseEntity.ok(serviceOfferingService.getAllServices(0, 1000, "id", "asc").getContent());
    }

    // 3. Get all bookings (Admin View) -> Returns BookingResponseDTO
    @GetMapping("/bookings")
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // 4. Delete/Remove a user by ID
    @DeleteMapping("/users/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    // 5. Platform stats overview
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userService.getAllUsers().size());
        stats.put("totalServices", serviceOfferingService.getAllServices(0, 1000, "id", "asc").getTotalElements());
        stats.put("totalBookings", bookingService.getAllBookings().size());
        return ResponseEntity.ok(stats);
    }
}