package com.mahesh.localserviceprovider.service;

import com.mahesh.localserviceprovider.dto.InspectionCostDTO;
import com.mahesh.localserviceprovider.dto.ServiceDTO;
import com.mahesh.localserviceprovider.model.Category;
import com.mahesh.localserviceprovider.model.ServiceEntity;
import com.mahesh.localserviceprovider.model.User;
import com.mahesh.localserviceprovider.repository.CategoryRepository;
import com.mahesh.localserviceprovider.repository.ServiceRepository;
import com.mahesh.localserviceprovider.repository.UserRepository;
import com.mahesh.localserviceprovider.specification.ServiceSpecification;
import com.mahesh.localserviceprovider.util.DistanceCalculator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServiceOfferingService {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    // --- CREATE SERVICE WITH LOCATION SUPPORT ---
    public ServiceDTO createService(ServiceDTO dto, String userEmail) {
        User provider = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + userEmail));

        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + dto.getCategoryId()));

        ServiceEntity service = new ServiceEntity(dto.getTitle(), dto.getDescription(), dto.getPrice(), category, provider);

        if (dto.getLocation() != null) {
            service.setLocation(dto.getLocation());
        }

        ServiceEntity saved = serviceRepository.save(service);
        return mapToDTO(saved);
    }

    // --- UPDATE SERVICE METHOD WITH OWNERSHIP & LOCATION CHECK ---
    public ServiceDTO updateService(Long id, ServiceDTO dto, String userEmail) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        // Prevent updating soft-deleted services
        if (Boolean.TRUE.equals(service.getIsDeleted())) {
            throw new RuntimeException("Cannot update a deleted service with id: " + id);
        }

        // Validate that current authenticated user is the owner
        if (!service.getProvider().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: You can only update services that you created.");
        }

        // Fetch category if updated
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with id: " + dto.getCategoryId()));
            service.setCategory(category);
        }

        // Update fields
        service.setTitle(dto.getTitle());
        service.setDescription(dto.getDescription());
        service.setPrice(dto.getPrice());

        if (dto.getLocation() != null) {
            service.setLocation(dto.getLocation());
        }

        ServiceEntity updatedService = serviceRepository.save(service);
        return mapToDTO(updatedService);
    }

    // --- PAGINATED & SORTED GET ALL SERVICES ---
    public Page<ServiceDTO> getAllServices(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<ServiceEntity> spec = ServiceSpecification.filterServices(null, null, null, null, null);
        Page<ServiceEntity> servicePage = serviceRepository.findAll(spec, pageable);

        List<ServiceDTO> dtos = servicePage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, servicePage.getTotalElements());
    }

    // --- PAGINATED & SORTED GET BY CATEGORY ---
    public Page<ServiceDTO> getServicesByCategory(Long categoryId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<ServiceEntity> spec = ServiceSpecification.filterServices(null, null, categoryId, null, null);
        Page<ServiceEntity> servicePage = serviceRepository.findAll(spec, pageable);

        List<ServiceDTO> dtos = servicePage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, servicePage.getTotalElements());
    }

    // --- DYNAMIC SEARCH & FILTERING METHOD (SUPPORTING LOCATION) ---
    public Page<ServiceDTO> searchServices(
            String keyword,
            String location,
            Long categoryId,
            Double minPrice,
            Double maxPrice,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase(Sort.Direction.ASC.name())
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Specification<ServiceEntity> spec = ServiceSpecification.filterServices(keyword, location, categoryId, minPrice, maxPrice);
        Page<ServiceEntity> servicePage = serviceRepository.findAll(spec, pageable);

        List<ServiceDTO> dtos = servicePage.getContent().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, servicePage.getTotalElements());
    }

    public ServiceDTO getServiceById(Long id) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        if (Boolean.TRUE.equals(service.getIsDeleted())) {
            throw new RuntimeException("Service not found with id: " + id);
        }

        return mapToDTO(service);
    }

    // --- SOFT DELETE SERVICE METHOD WITH OWNERSHIP CHECK ---
    public void deleteService(Long id, String userEmail) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        if (!service.getProvider().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: You can only delete services that you created.");
        }

        service.setIsDeleted(true);
        serviceRepository.save(service);
    }

    // --- RESTORE SOFT-DELETED SERVICE METHOD ---
    public ServiceDTO restoreService(Long id, String userEmail) {
        ServiceEntity service = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + id));

        if (!service.getProvider().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: You can only restore services that you created.");
        }

        service.setIsDeleted(false);
        ServiceEntity restored = serviceRepository.save(service);

        return mapToDTO(restored);
    }

    // =========================================================================
    // --- DISTANCE-BASED INSPECTION & TRAVEL COST CALCULATION ---
    // =========================================================================

    public InspectionCostDTO calculateInspectionCost(
            Long serviceId,
            Double customerLat,
            Double customerLng,
            Double providerLat,
            Double providerLng) {

        ServiceEntity service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found with id: " + serviceId));

        if (Boolean.TRUE.equals(service.getIsDeleted())) {
            throw new RuntimeException("Service not found with id: " + serviceId);
        }

        // Default baseline coordinates if provider coordinates are not supplied
        double pLat = (providerLat != null) ? providerLat : 16.5062;
        double pLng = (providerLng != null) ? providerLng : 80.6480;

        double cLat = (customerLat != null) ? customerLat : pLat;
        double cLng = (customerLng != null) ? customerLng : pLng;

        // 1. Calculate actual distance in KM
        double distanceKm = DistanceCalculator.calculateDistanceKm(cLat, cLng, pLat, pLng);

        // 2. Fetch rates from the ServiceEntity
        double baseFee = (service.getInspectionFee() != null) ? service.getInspectionFee() : 99.0;
        double freeKm = (service.getFreeDistanceKm() != null) ? service.getFreeDistanceKm() : 3.0;
        double perKmRate = (service.getPerKmRate() != null) ? service.getPerKmRate() : 12.0;

        // 3. Calculate billable distance & surcharge
        double billableKm = DistanceCalculator.calculateBillableKm(distanceKm, freeKm);
        double travelSurcharge = DistanceCalculator.calculateTravelSurcharge(billableKm, perKmRate);
        double totalVisitingAmount = Math.round((baseFee + travelSurcharge) * 100.0) / 100.0;

        return new InspectionCostDTO(
                service.getId(),
                service.getTitle(),
                baseFee,
                distanceKm,
                freeKm,
                billableKm,
                perKmRate,
                travelSurcharge,
                totalVisitingAmount
        );
    }

    private ServiceDTO mapToDTO(ServiceEntity service) {
        ServiceDTO dto = new ServiceDTO();
        dto.setId(service.getId());
        dto.setTitle(service.getTitle());
        dto.setDescription(service.getDescription());
        dto.setPrice(service.getPrice());
        dto.setLocation(service.getLocation());

        if (service.getCategory() != null) {
            dto.setCategoryId(service.getCategory().getId());
            dto.setCategoryName(service.getCategory().getName());
        }

        if (service.getProvider() != null) {
            dto.setProviderId(service.getProvider().getId());
            dto.setProviderName(service.getProvider().getName());
        }

        return dto;
    }
}