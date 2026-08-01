package com.mahesh.localserviceprovider.controller;

import com.mahesh.localserviceprovider.dto.ServiceDTO;
import com.mahesh.localserviceprovider.service.ServiceOfferingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    @Autowired
    private ServiceOfferingService serviceOfferingService;

    @PostMapping
    public ResponseEntity<ServiceDTO> createService(@Valid @RequestBody ServiceDTO dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new RuntimeException("Unauthorized access: Valid JWT token required.");
        }

        String userEmail = authentication.getName();
        return ResponseEntity.ok(serviceOfferingService.createService(dto, userEmail));
    }

    // --- PAGINATED & SORTED GET ALL SERVICES ---
    @GetMapping
    public ResponseEntity<Page<ServiceDTO>> getAllServices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(serviceOfferingService.getAllServices(page, size, sortBy, sortDir));
    }

    // --- PAGINATED & SORTED GET BY CATEGORY ---
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<Page<ServiceDTO>> getServicesByCategory(
            @PathVariable Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(serviceOfferingService.getServicesByCategory(categoryId, page, size, sortBy, sortDir));
    }

    // --- DYNAMIC SEARCH & LOCATION FILTER ENDPOINT ---
    @GetMapping("/search")
    public ResponseEntity<Page<ServiceDTO>> searchServices(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        return ResponseEntity.ok(serviceOfferingService.searchServices(
                keyword, location, categoryId, minPrice, maxPrice, page, size, sortBy, sortDir
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceDTO> getServiceById(@PathVariable Long id) {
        return ResponseEntity.ok(serviceOfferingService.getServiceById(id));
    }

    // --- UPDATE SERVICE WITH AUTH ---
    @PutMapping("/{id}")
    public ResponseEntity<ServiceDTO> updateService(
            @PathVariable Long id,
            @Valid @RequestBody ServiceDTO dto
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new RuntimeException("Unauthorized access: Valid JWT token required.");
        }

        String userEmail = authentication.getName();
        return ResponseEntity.ok(serviceOfferingService.updateService(id, dto, userEmail));
    }

    // --- SOFT DELETE SERVICE WITH AUTH ---
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new RuntimeException("Unauthorized access: Valid JWT token required.");
        }

        String userEmail = authentication.getName();
        serviceOfferingService.deleteService(id, userEmail);
        return ResponseEntity.noContent().build();
    }

    // --- RESTORE SOFT-DELETED SERVICE ---
    @PutMapping("/{id}/restore")
    public ResponseEntity<ServiceDTO> restoreService(@PathVariable Long id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new RuntimeException("Unauthorized access: Valid JWT token required.");
        }

        String userEmail = authentication.getName();
        return ResponseEntity.ok(serviceOfferingService.restoreService(id, userEmail));
    }
}