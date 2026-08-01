package com.mahesh.localserviceprovider.service;

import com.mahesh.localserviceprovider.dto.ServiceDTO;
import com.mahesh.localserviceprovider.model.Category;
import com.mahesh.localserviceprovider.model.ServiceEntity;
import com.mahesh.localserviceprovider.model.User;
import com.mahesh.localserviceprovider.repository.CategoryRepository;
import com.mahesh.localserviceprovider.repository.ServiceRepository;
import com.mahesh.localserviceprovider.repository.UserRepository;
import com.mahesh.localserviceprovider.specification.ServiceSpecification;
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

        // Uses specification to filter out soft-deleted services
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

        // Uses specification to filter by category AND exclude soft-deleted services
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

        // Uses ServiceSpecification (applies isDeleted = false along with location filtering)
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

        // Validate that current authenticated user is the owner
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

        // Validate that current authenticated user is the owner
        if (!service.getProvider().getEmail().equals(userEmail)) {
            throw new RuntimeException("Unauthorized: You can only restore services that you created.");
        }

        service.setIsDeleted(false);
        ServiceEntity restored = serviceRepository.save(service);

        return mapToDTO(restored);
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