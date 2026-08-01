package com.mahesh.localserviceprovider.repository;

import com.mahesh.localserviceprovider.model.ServiceEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long>, JpaSpecificationExecutor<ServiceEntity> {

    // Paginated search by category ID
    Page<ServiceEntity> findByCategoryId(Long categoryId, Pageable pageable);

    // Paginated search by provider ID
    Page<ServiceEntity> findByProviderId(Long providerId, Pageable pageable);

    // Paginated search by Location/Address (case-insensitive)
    Page<ServiceEntity> findByLocationContainingIgnoreCase(String location, Pageable pageable);
}